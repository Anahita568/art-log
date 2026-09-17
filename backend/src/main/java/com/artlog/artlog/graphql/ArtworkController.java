package com.artlog.artlog.graphql;

import java.util.List;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import com.artlog.artlog.model.Artwork;
import com.artlog.artlog.model.Tag;
import com.artlog.artlog.model.TagType;
import com.artlog.artlog.repository.ArtworkRepository;
import com.artlog.artlog.repository.TagRepository;

@Controller
public class ArtworkController {

    private final ArtworkRepository artworkRepository;
    private final TagRepository tagRepository;

    public ArtworkController(ArtworkRepository artworkRepository, TagRepository tagRepository) {
        this.artworkRepository = artworkRepository;
        this.tagRepository = tagRepository;
    }

    @QueryMapping
    public List<Artwork> artworks() {
        return artworkRepository.findAll();
    }

    @QueryMapping
    public Artwork artwork(@Argument Long id) {
        return artworkRepository.findById(id).orElse(null);
    }

    @QueryMapping
    public List<Tag> tags(@Argument TagType type) {
        return type == null ? tagRepository.findAll() : tagRepository.findByType(type);
    }
}
