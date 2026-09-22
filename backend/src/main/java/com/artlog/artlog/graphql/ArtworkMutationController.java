package com.artlog.artlog.graphql;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.stereotype.Controller;

import com.artlog.artlog.model.Artwork;
import com.artlog.artlog.repository.ArtworkRepository;
import com.artlog.artlog.service.TagService;

@Controller
public class ArtworkMutationController {

    private final ArtworkRepository artworkRepository;
    private final TagService tagService;

    public ArtworkMutationController(ArtworkRepository artworkRepository, TagService tagService) {
        this.artworkRepository = artworkRepository;
        this.tagService = tagService;
    }

    @MutationMapping
    public Artwork addArtwork(@Argument AddArtworkInput input) {
        Artwork artwork = new Artwork();
        artwork.setTitle(input.title());
        artwork.setArtist(input.artist());
        artwork.setYear(input.year());
        artwork.setImageUrl(input.imageUrl());
        artwork.setNotes(input.notes());
        artwork.setTags(tagService.findOrCreateAll(input.tags()));
        return artworkRepository.save(artwork);
    }

    @MutationMapping
    public Artwork updateArtworkNotes(@Argument Long id, @Argument String notes) {
        Artwork artwork = artworkRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("No artwork with id " + id));
        artwork.setNotes(notes);
        return artworkRepository.save(artwork);
    }

    @MutationMapping
    public boolean deleteArtwork(@Argument Long id) {
        if (!artworkRepository.existsById(id)) {
            return false;
        }
        artworkRepository.deleteById(id);
        return true;
    }
}
