package com.artlog.artlog.graphql;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.artlog.artlog.admin.AdminToken;
import com.artlog.artlog.repository.ArtworkRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * End to end over HTTP, because the guarantee that matters is about the real request pipeline: without
 * the admin token, no mutation runs (and nothing is saved), while queries stay public.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "artlog.admin-token=" + AdminTokenInterceptorTest.TOKEN,
        "artlog.storage=local",
        "artlog.upload-dir=target/test-uploads"})
class AdminTokenInterceptorTest {

    static final String TOKEN = "test-admin-token";

    private static final String ADD_ARTWORK = "mutation { addArtwork(input: {title: \"Untitled\"}) { id } }";
    private static final String IS_ADMIN = "query { isAdmin }";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ArtworkRepository artworkRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @AfterEach
    void deleteSavedArtworks() {
        artworkRepository.deleteAll();
    }

    @Test
    void mutationWithoutTokenIsRejectedAndNothingIsSaved() throws Exception {
        JsonNode response = execute(ADD_ARTWORK, null, null);

        assertThat(errorClassification(response)).isEqualTo("UNAUTHORIZED");
        assertThat(artworkRepository.count()).isZero();
    }

    @Test
    void mutationWithWrongTokenIsRejected() throws Exception {
        JsonNode response = execute(ADD_ARTWORK, null, "guess");

        assertThat(errorClassification(response)).isEqualTo("UNAUTHORIZED");
        assertThat(artworkRepository.count()).isZero();
    }

    @Test
    void mutationAlongsideASelectedQueryIsStillRejected() throws Exception {
        String document = "query Check { isAdmin } " + ADD_ARTWORK.replace("mutation", "mutation Sneak");

        JsonNode response = execute(document, "Check", null);

        assertThat(errorClassification(response)).isEqualTo("UNAUTHORIZED");
    }

    @Test
    void queriesArePublicAndReportNotAdmin() throws Exception {
        JsonNode response = execute(IS_ADMIN, null, null);

        assertThat(response.path("errors").isMissingNode()).isTrue();
        assertThat(response.at("/data/isAdmin").asBoolean()).isFalse();
    }

    @Test
    void adminTokenUnlocksMutationsAndIsReported() throws Exception {
        JsonNode added = execute(ADD_ARTWORK, null, TOKEN);
        JsonNode isAdmin = execute(IS_ADMIN, null, TOKEN);

        assertThat(added.path("errors").isMissingNode()).isTrue();
        assertThat(artworkRepository.count()).isEqualTo(1);
        assertThat(isAdmin.at("/data/isAdmin").asBoolean()).isTrue();
    }

    private JsonNode execute(String document, String operationName, String token) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("query", document);
        if (operationName != null) {
            body.put("operationName", operationName);
        }
        MockHttpServletRequestBuilder request = post("/graphql")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body));
        if (token != null) {
            request.header(AdminToken.HEADER, token);
        }

        MvcResult result = mockMvc.perform(request).andReturn();
        if (result.getRequest().isAsyncStarted()) {
            result = mockMvc.perform(asyncDispatch(result)).andReturn();
        }
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private static String errorClassification(JsonNode response) {
        return response.at("/errors/0/extensions/classification").asText();
    }
}
