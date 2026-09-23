package com.artlog.artlog.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.artlog.artlog.model.Artwork;

public interface ArtworkRepository extends JpaRepository<Artwork, Long>, JpaSpecificationExecutor<Artwork> {

    @Override
    @EntityGraph(attributePaths = "tags")
    Optional<Artwork> findById(Long id);

    @EntityGraph(attributePaths = "tags")
    List<Artwork> findByIdIn(List<Long> ids);

    long countByTagsId(Long tagId);

    List<Artwork> findByTagsId(Long tagId);
}
