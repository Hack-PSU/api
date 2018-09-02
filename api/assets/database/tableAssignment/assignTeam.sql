/* assignTeam procedure
 * 
 * Generates an association of a project and team member UIDs
 *
*/
CREATE PROCEDURE `assignTeam`(in projectName_param varchar(50), in teamUIDs_param longtext, in projectCategories_param longtext, out projectID_param varchar(45))
proc_lbl:begin
	set @hackathon_var := (select `uid` from `HACKATHON` where `active` = 1);
	
    set @pos := 1;
    set @len := locate(',', teamUIDs_param) - @pos;
    set @num := 0;
    teamLoop: while true do
        set @teamMember := substring(teamUIDs_param, @pos, @len);
        set @num := (select count(*) from PROJECT_TEAM where userID = @teamMember);
        if @num > 0 then
            signal sqlstate '45000' set message_text = 'duplilcate user detected';
            leave proc_lbl;
        end if;
        set @pos := @pos + @len + 1;
        set @n := locate(',', teamUIDs_param, @pos);
        if @n = 0 then
            set @teamMember := substring(teamUIDs_param, @pos, @len);
            set @num := (select count(*) from PROJECT_TEAM where userID = @teamMember);
            if @num > 0 then
                signal sqlstate '45000' set message_text = 'duplilcate user detected';
                leave proc_lbl;
            end if;
            leave teamLoop;
        end if;
        set @len := @n - @pos;
    end while;

    set projectID_param := uuid();
    insert into PROJECT_LIST (projectID, projectName) values (projectID_param, projectName_param);
    
    set @pos := 1;
    set @len := locate(',', teamUIDs_param) - @pos;
    set @num := 0;
    insertLoop: while true do
        set @teamMember := substring(teamUIDs_param, @pos, @len);
        insert into PROJECT_TEAM (userID, projectID) values (@teamMember, projectID_param);
        set @pos := @pos + @len + 1;
        set @n := locate(',', teamUIDs_param, @pos);
        if @n = 0 then
            set @teamMember := substring(teamUIDs_param, @pos, @len);
            set @num := (select count(*) from PROJECT_TEAM where userID = @teamMember);
            insert into PROJECT_TEAM (userID, projectID) values (@teamMember, projectID_param);
            leave insertLoop;
        end if;
        set @len := @n - @pos;
    end while;
    
    set @pos := 1;
    set @len := locate(',', projectCategories_param) - @pos;
    set @num := 0;
    catLoop: while true do
        set @cat := substring(projectCategories_param, @pos, @len);
        set @catNum := cast(@cat as unsigned);
        insert into PROJECT_CATEGORIES (projectID, categoryID) values (projectID_param, @catNum);
        set @pos := @pos + @len + 1;
        set @n := locate(',', teamUIDs_param, @pos);
        if @n = 0 then
            set @cat := substring(projectCategories_param, @pos, @len);
            set @catNum := cast(@cat as unsigned);
            if @catNum <> 0 then
                insert into PROJECT_CATEGORIES (projectID, categoryID) values (projectID_param, @catNum);
            end if;
            leave catLoop;
        end if;
        set @len := @n - @pos;
    end while;
    
end