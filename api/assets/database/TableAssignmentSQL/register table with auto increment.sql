/*
 * Stored procedure create or update
 *
 * Stored procedure:
 *	
 *	Name:
 *		register_table_test
 *
 *	Use:
 *		Insert records for table assignment and support
 *
 *	Assumptions:
 *		Database Engine:
 *			MySQL 5.5 or higher using InnoDB or other compatible engine
 *			InnoDB is required to ensure that the engine handles concurrent inserts on an auto incremented table
 *		TABLE_ASSIGNMENTS_TEST contains the following
 *			tableNumber: int(11) auto increment
 *			projectID: char(36) unique not null
 *		TABLE_SUPPORT_TEST contains the following
 *			tableID: int(11)
 *			projectID: char(36)
 *			priority: tinyint(1)
 *
 *	Inputs:
 *		project_id_param char(36):	Used as the projectID field for TABLE_ASSIGNMENTS_TEST
 *		category_id_param int(11):	Used as the categoryID field for TABLE_SUPPORT_TEST
 *		priority_param tinyint(1):	Used as the priority fild for TABLE_SUPPORT_TEST
 *
 *	Outputs:
 *		table_id_ret int(11):	The tableNumber inserted into TABLE_ASSIGNMENTS_TEST
 *
 *	Method:
 *		Insert the table assignment record; MySQL using InnoDB will handle concurrency issues on the auto increment
 *		Select the table number from the table assignment table where the project id is that which we just inserted
 *		Insert the table support record; no concurrency issue can be had
 */
DELIMITER $$
drop procedure if exists `register_table_test`$$
create procedure `register_table_test` (in `project_id_param` char(36), in `category_id_param` int(11), in `priority_param` tinyint(1), out `table_id_ret` int(11))
begin
	insert into `TABLE_ASSIGNMENTS_TEST` (`projectId`) values (`project_id_param`);
    select `tableNumber` into `table_id_ret` from `TABLE_ASSIGNMENTS_TEST` where `projectID` = `project_id_param`;
    insert into `TABLE_SUPPORT_TEST` (`tableID`, `categoryID`, `priority`) values (`table_id_ret`, `category_id_param`, `piority_param`);
end$$