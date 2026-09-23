package com.artlog.artlog.graphql;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

import com.artlog.artlog.model.Tag;
import com.artlog.artlog.repository.ArtworkRepository;
import com.artlog.artlog.service.TagService;

@Controller
public class TagMutationController {

    private final TagService tagService;
    private final ArtworkRepository artworkRepository;

    public TagMutationController(TagService tagService, ArtworkRepository artworkRepository) {
        this.tagService = tagService;
        this.artworkRepository = artworkRepository;
    }

    @MutationMapping
    public Tag renameTag(@Argument Long id, @Argument String name) {
        return tagService.renameTag(id, name);
    }

    @MutationMapping
    public boolean deleteTag(@Argument Long id) {
        return tagService.deleteTag(id);
    }

    @SchemaMapping(typeName = "Tag", field = "usageCount")
    public long usageCount(Tag tag) {
        return artworkRepository.countByTagsId(tag.getId());
    }
}
