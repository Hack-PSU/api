CREATE PROCEDURE `assignTable`(in projectID_param char(36), in categoryID_param int(11), out tableNumber_param int(11))
begin
    set tableNumber_param := 
        (select tableID from TABLE_SUPPORT 
            where categoryID = categoryID_param and tableID not in (select tableNumber from TABLE_ASSIGNMENTS)
                order by priority desc limit 1 for update);
    if tableNumber_param is not null then
        insert into TABLE_ASSIGNMENTS (tableNumber, projectID) values (tableNumber_param, projectID_param);
    end if;
    update TABLE_SUPPORT set tableID = tableNumber_param where tableID = tableNumber_param; 
end