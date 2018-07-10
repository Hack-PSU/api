DELIMITER $$
drop procedure if exists `register_table_test`$$
create procedure `register_table_test` (in `project_id_param` char(36), in `category_id_param` int(11), in `priority_param` tinyint(1), out `table_id_ret` int(11))
begin
	insert into `TABLE_ASSIGNMENTS_TEST` (`projectId`) values (`project_id_param`);
    select `tableNumber` into @newTableNumber from `TABLE_ASSIGNMENTS_TEST` where `projectID` = `project_id_param`;
    insert into `TABLE_SUPPORT_TEST` (`tableID`, `categoryID`, `priority`) values (@newTableNumber, `category_id_param`, `piority_param`);
    set `table_id_ret` = @newTableNumber;
end$$