package com.artlog.artlog.graphql;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
    public ArtworkPage artworks(
            @Argument ArtworkFilterInput filter,
            @Argument ArtworkSort sort,
            @Argument int page,
            @Argument int pageSize) {
        Page<Artwork> result = artworkRepository.findAll(
                toSpecification(filter), PageRequest.of(page, pageSize, sort.toSort()));

        return new ArtworkPage(attachTags(result.getContent()), result.getTotalElements(), result.hasNext());
    }

    /**
     * The paged query above deliberately doesn't fetch-join tags (that would force Hibernate to
     * paginate in memory over the whole to-many join). Instead, tags are batch-loaded for just this
     * page's ids and reattached in the original (sorted) order.
     */
    private List<Artwork> attachTags(List<Artwork> artworks) {
        if (artworks.isEmpty()) {
            return artworks;
        }
        List<Long> ids = artworks.stream().map(Artwork::getId).toList();
        Map<Long, Artwork> withTagsById = artworkRepository.findByIdIn(ids).stream()
                .collect(Collectors.toMap(Artwork::getId, Function.identity(), (a, b) -> a, LinkedHashMap::new));
        return ids.stream().map(withTagsById::get).toList();
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
                .where(ArtworkSpecifications.hasAnyTag(TagType.MEDIUM, f.mediums()))
                .and(ArtworkSpecifications.hasAnyTag(TagType.MOVEMENT, f.movements()))
                .and(ArtworkSpecifications.hasAnyTag(TagType.MOOD, f.moods()))
                .and(ArtworkSpecifications.hasAnyTag(TagType.COLOR, f.colors()))
                .and(ArtworkSpecifications.hasAnyTag(TagType.SUBJECT, f.subjects()))
                .and(ArtworkSpecifications.matchesSearch(f.search()));
    }
}
