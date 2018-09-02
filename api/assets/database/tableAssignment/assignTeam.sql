/* assignTeam procedure
 * 
 * Generates an association of a project and team member UIDs local to the active hackathon UID
 * Does not register a table for the project
 *
 * In:
 *  projectName_param (varchar(50)): The name of the project -- MUST BE SANITIZED
 *  teamUIDs_param (longtext): The list of team member UIDs in a comma separated list (ie. "1234, 4556")
 *  projectCategories_param (longtext): The list of categories to register this project for in a comma separated list (ie. "1, 4, 5")
 * Out:
 *  projectID_param (varchar(45)): The uuid given to the project upon full processing
 * Signals:
 *  45000: duplicate user detected; one user may only be in one project
 *
*/
CREATE PROCEDURE `assignTeam`(in projectName_param varchar(50), in teamUIDs_param longtext, in projectCategories_param longtext, out projectID_param varchar(45))
proc_lbl:begin
	--Get the active hackathon UID
	set @hackathon_var := (select `uid` from `HACKATHON` where `active` = 1);
	
	--Prep for looping
    set @pos := 1;
    set @len := locate(',', teamUIDs_param) - @pos;
    set @num := 0;
	
	--Process out all team member UIDs and make sure they aren't in another team yet
    teamLoop: while true do
        set @teamMember := substring(teamUIDs_param, @pos, @len);
		
		--Sanity check: is the user already in a team 
        set @num := (select count(*) from PROJECT_TEAM where userID = @teamMember);
        if @num > 0 then
            signal sqlstate '45000' set message_text = 'duplilcate user detected';
            leave proc_lbl;
        end if;
		
		--Setup to parse the next team member
        set @pos := @pos + @len + 1;
        set @n := locate(',', teamUIDs_param, @pos);
		
		--Special case for the last user: 
        if @n = 0 then
            set @teamMember := substring(teamUIDs_param, @pos, @len);
			
			--Sanity check: is the user already in a team 
            set @num := (select count(*) from PROJECT_TEAM where userID = @teamMember);
            if @num > 0 then
                signal sqlstate '45000' set message_text = 'duplilcate user detected';
                leave proc_lbl;
            end if;
			
			--break
            leave teamLoop;
        end if;
		
		--Continue the loop
        set @len := @n - @pos;
    end while;

	--Generate a UID for the project and create the project entry
    set projectID_param := uuid();
    insert into PROJECT_LIST (projectID, projectName, hackathon) values (projectID_param, projectName_param, @hackathon_var);
    
	--Prep to loop again, this time associating 
    set @pos := 1;
    set @len := locate(',', teamUIDs_param) - @pos;
    set @num := 0;
	
	--Loop over all team members again, inserting all associations to the project this time
    insertLoop: while true do
        set @teamMember := substring(teamUIDs_param, @pos, @len);
		--Add the team member
        insert into PROJECT_TEAM (userID, projectID) values (@teamMember, projectID_param);
        set @pos := @pos + @len + 1;
        set @n := locate(',', teamUIDs_param, @pos);
		
		--Special case for the last team member
        if @n = 0 then
            set @teamMember := substring(teamUIDs_param, @pos, @len);
            set @num := (select count(*) from PROJECT_TEAM where userID = @teamMember);
            insert into PROJECT_TEAM (userID, projectID) values (@teamMember, projectID_param);
            
			--break
			leave insertLoop;
        end if;
        set @len := @n - @pos;
    end while;
    
	--Prep to loop again
    set @pos := 1;
    set @len := locate(',', projectCategories_param) - @pos;
    set @num := 0;
	
	--Loop over all categories, making associations to the project with each
    catLoop: while true do
        set @cat := substring(projectCategories_param, @pos, @len);
        set @catNum := cast(@cat as unsigned);
        
		--Make the association in project categories
		insert into PROJECT_CATEGORIES (projectID, categoryID) values (projectID_param, @catNum);
        set @pos := @pos + @len + 1;
        set @n := locate(',', teamUIDs_param, @pos);
		
		--Special case for last category
        if @n = 0 then
            set @cat := substring(projectCategories_param, @pos, @len);
            set @catNum := cast(@cat as unsigned);
            if @catNum <> 0 then
                insert into PROJECT_CATEGORIES (projectID, categoryID) values (projectID_param, @catNum);
            end if;
			
			--break
            leave catLoop;
        end if;
        set @len := @n - @pos;
    end while;
    
end