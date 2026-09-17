package com.artlog.artlog.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.artlog.artlog.model.Artwork;

public interface ArtworkRepository extends JpaRepository<Artwork, Long> {

    @Override
    @EntityGraph(attributePaths = "tags")
    List<Artwork> findAll();

    @Override
    @EntityGraph(attributePaths = "tags")
    Optional<Artwork> findById(Long id);
}
