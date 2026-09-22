package com.artlog.artlog.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.artlog.artlog.model.Tag;
import com.artlog.artlog.model.TagType;

public interface TagRepository extends JpaRepository<Tag, Long> {

    List<Tag> findByType(TagType type);

    Optional<Tag> findByNameAndType(String name, TagType type);
}
