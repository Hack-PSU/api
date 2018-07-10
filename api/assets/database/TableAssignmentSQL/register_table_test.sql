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
 *			MySQL not using InnoDB
 *			Some engines, including MySQL's InnoDB prevent using locks from stored procedures
 *			This prevents deadlocking when threads are aborted, but makes this not work
 *		TABLE_ASSIGNMENTS_TEST contains the following
 *			tableNumber: int(11)
 *			projectID: char(36)
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
 *		Wait for a writer lock on the assignment table
 *		Select the largest tableNumber from the assignment table
 *		The new insert will use that number plus one as the new tableNumber
 *		Insert the table assignment record with the new table number
 *		Insert the table support record
 */
DELIMITER $$
drop procedure if exists `register_table_test`$$
create procedure `register_table_test` (in `project_id_param` char(36), in `category_id_param` int(11), in `priority_param` tinyint(1), out `table_id_ret` int(11))
begin
	lock tables `TABLE_ASSIGNMENT_TEST` write;
	select max(`tableNumber`) into `table_id_ret` from `TABLE_ASSIGNMENT_TEST`;
    set `table_id_ret` = `table_id_ret` + 1;
    insert into `TABLE_ASSIGNMENT_TEST` (`tableNumber`, `projectId`) values (`table_id_ret`, `project_id_param`);
    unlock tables;
    lock tables `TABLE_SUPPORT_TEST` write;
    insert into `TABLE_SUPPORT_TEST` (`tableID`, `categoryID`, `priority`) values (`table_id_ret`, `category_ID_param`, `priority_param`);
    unlock tables;
end$$