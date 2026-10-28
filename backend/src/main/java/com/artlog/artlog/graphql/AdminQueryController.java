package com.artlog.artlog.graphql;

import org.springframework.graphql.data.method.annotation.ContextValue;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
public class AdminQueryController {

    /** Lets the frontend check a token before showing editing controls; set by {@link AdminTokenInterceptor}. */
    @QueryMapping
    public boolean isAdmin(@ContextValue(AdminTokenInterceptor.IS_ADMIN) boolean isAdmin) {
        return isAdmin;
    }
}
