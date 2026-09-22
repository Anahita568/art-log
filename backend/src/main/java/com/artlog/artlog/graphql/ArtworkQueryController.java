package com.artlog.artlog.graphql;

import java.util.List;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import com.artlog.artlog.model.Artwork;
import com.artlog.artlog.model.Tag;
import com.artlog.artlog.model.TagType;
import com.artlog.artlog.repository.ArtworkRepository;
import com.artlog.artlog.repository.ArtworkSpecifications;
import com.artlog.artlog.repository.TagRepository;

@Controller
public class ArtworkQueryController {

    private final ArtworkRepository artworkRepository;
    private final TagRepository tagRepository;

    public ArtworkQueryController(ArtworkRepository artworkRepository, TagRepository tagRepository) {
        this.artworkRepository = artworkRepository;
        this.tagRepository = tagRepository;
    }

    @QueryMapping
    public List<Artwork> artworks(@Argument ArtworkFilterInput filter) {
        return artworkRepository.findAll(toSpecification(filter));
    }

    @QueryMapping
    public Artwork artwork(@Argument Long id) {
        return artworkRepository.findById(id).orElse(null);
    }

    @QueryMapping
    public List<Tag> tags(@Argument TagType type) {
        return type == null ? tagRepository.findAll() : tagRepository.findByType(type);
    }

    private Specification<Artwork> toSpecification(ArtworkFilterInput filter) {
        ArtworkFilterInput f = filter != null ? filter : ArtworkFilterInput.NONE;
        return Specification
                .where(ArtworkSpecifications.fetchTags())
                .and(ArtworkSpecifications.hasAnyTag(TagType.MEDIUM, f.mediums()))
                .and(ArtworkSpecifications.hasAnyTag(TagType.MOVEMENT, f.movements()))
                .and(ArtworkSpecifications.hasAnyTag(TagType.MOOD, f.moods()))
                .and(ArtworkSpecifications.hasAnyTag(TagType.COLOR, f.colors()))
                .and(ArtworkSpecifications.hasAnyTag(TagType.SUBJECT, f.subjects()))
                .and(ArtworkSpecifications.matchesSearch(f.search()));
    }
}
