UPDATE repos 
    SET current_version = current_version + 1
    WHERE repo_id = @repoId