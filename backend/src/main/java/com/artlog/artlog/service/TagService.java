package com.artlog.artlog.service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.artlog.artlog.graphql.TagInput;
import com.artlog.artlog.model.Tag;
import com.artlog.artlog.repository.TagRepository;

@Service
public class TagService {

    private final TagRepository tagRepository;

    public TagService(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
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
}
