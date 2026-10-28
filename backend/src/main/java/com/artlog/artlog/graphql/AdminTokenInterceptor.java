package com.artlog.artlog.graphql;

import java.util.Map;

import org.springframework.graphql.execution.ErrorType;
import org.springframework.graphql.server.WebGraphQlInterceptor;
import org.springframework.graphql.server.WebGraphQlRequest;
import org.springframework.graphql.server.WebGraphQlResponse;
import org.springframework.graphql.support.DefaultExecutionGraphQlResponse;
import org.springframework.stereotype.Component;

import com.artlog.artlog.admin.AdminToken;

import graphql.ExecutionResult;
import graphql.GraphqlErrorBuilder;
import graphql.language.Document;
import graphql.language.OperationDefinition;
import graphql.parser.InvalidSyntaxException;
import graphql.parser.Parser;
import reactor.core.publisher.Mono;

/**
 * Rejects any GraphQL request containing a mutation unless it carries the admin token, before anything
 * executes. Queries always pass. Also exposes the result as the {@value #IS_ADMIN} context value, which
 * the {@code isAdmin} query reports back so the frontend knows whether to show editing controls.
 */
@Component
public class AdminTokenInterceptor implements WebGraphQlInterceptor {

    static final String IS_ADMIN = "isAdmin";

    private final AdminToken adminToken;

    public AdminTokenInterceptor(AdminToken adminToken) {
        this.adminToken = adminToken;
    }

    @Override
    public Mono<WebGraphQlResponse> intercept(WebGraphQlRequest request, Chain chain) {
        boolean isAdmin = adminToken.matches(request.getHeaders().getFirst(AdminToken.HEADER));
        if (!isAdmin && containsMutation(request.getDocument())) {
            return Mono.just(unauthorized(request));
        }
        request.configureExecutionInput((input, builder) -> builder.graphQLContext(Map.of(IS_ADMIN, isAdmin)).build());
        return chain.next(request);
    }

    /**
     * Checks every operation in the document, not just the one selected by operationName, so a request
     * can't smuggle a mutation past this check. Unparseable documents fail in execution without running.
     */
    private static boolean containsMutation(String document) {
        try {
            Document parsed = Parser.parse(document);
            return parsed.getDefinitionsOfType(OperationDefinition.class).stream()
                    .anyMatch(operation -> operation.getOperation() == OperationDefinition.Operation.MUTATION);
        } catch (InvalidSyntaxException e) {
            return false;
        }
    }

    private static WebGraphQlResponse unauthorized(WebGraphQlRequest request) {
        ExecutionResult result = ExecutionResult.newExecutionResult()
                .addError(GraphqlErrorBuilder.newError()
                        .errorType(ErrorType.UNAUTHORIZED)
                        .message("Editing requires the admin token")
                        .build())
                .build();
        return new WebGraphQlResponse(new DefaultExecutionGraphQlResponse(request.toExecutionInput(), result));
    }
}
