package com.artlog.artlog.service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.artlog.artlog.graphql.TagInput;
import com.artlog.artlog.model.Artwork;
import com.artlog.artlog.model.Tag;
import com.artlog.artlog.repository.ArtworkRepository;
import com.artlog.artlog.repository.TagRepository;

@Service
public class TagService {

    private final TagRepository tagRepository;
    private final ArtworkRepository artworkRepository;

    public TagService(TagRepository tagRepository, ArtworkRepository artworkRepository) {
        this.tagRepository = tagRepository;
        this.artworkRepository = artworkRepository;
    }

    @Transactional
    public Set<Tag> findOrCreateAll(List<TagInput> inputs) {
        if (inputs == null) {
            return Set.of();
        }
        return inputs.stream()
                .map(this::findOrCreate)
                .collect(Collectors.toSet());
    }

    private Tag findOrCreate(TagInput input) {
        return tagRepository.findByNameAndType(input.name(), input.type())
                .orElseGet(() -> tagRepository.save(new Tag(input.name(), input.type())));
    }

    @Transactional
    public Tag renameTag(Long id, String name) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("No tag with id " + id));

        tagRepository.findByNameAndType(name, tag.getType())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("A " + tag.getType() + " tag named \"" + name + "\" already exists");
                });

        tag.setName(name);
        return tagRepository.save(tag);
    }

    @Transactional
    public boolean deleteTag(Long id) {
        Tag tag = tagRepository.findById(id).orElse(null);
        if (tag == null) {
            return false;
        }

        List<Artwork> artworksWithTag = artworkRepository.findByTagsId(id);
        for (Artwork artwork : artworksWithTag) {
            artwork.getTags().remove(tag);
        }
        artworkRepository.saveAll(artworksWithTag);

        tagRepository.deleteById(id);
        return true;
    }
}
