package com.artlog.artlog.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.artlog.artlog.model.Artwork;

public interface ArtworkRepository extends JpaRepository<Artwork, Long>, JpaSpecificationExecutor<Artwork> {

    @Override
    @EntityGraph(attributePaths = "tags")
    Optional<Artwork> findById(Long id);
}
