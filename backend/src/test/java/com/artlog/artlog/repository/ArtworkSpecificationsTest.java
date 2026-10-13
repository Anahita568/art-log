package com.artlog.artlog.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.context.ActiveProfiles;

import com.artlog.artlog.model.Artwork;
import com.artlog.artlog.model.Tag;
import com.artlog.artlog.model.TagType;

/**
 * Covers the composable tag-filtering logic in {@link ArtworkSpecifications}: AND across axes,
 * OR within an axis, and the free-text search fallback. This is the one piece of filtering logic
 * complex enough that a regression (e.g. two axes silently ORed together) would be invisible by eye.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class ArtworkSpecificationsTest {

    @Autowired
    private ArtworkRepository artworkRepository;

    @Autowired
    private TagRepository tagRepository;

    @BeforeEach
    void seedCatalog() {
        Tag oilPaint = tagRepository.save(new Tag("Oil paint", TagType.MEDIUM));
        Tag watercolor = tagRepository.save(new Tag("Watercolor", TagType.MEDIUM));
        Tag nostalgic = tagRepository.save(new Tag("Nostalgic", TagType.MOOD));
        Tag joyful = tagRepository.save(new Tag("Joyful", TagType.MOOD));

        artworkRepository.saveAll(List.of(
                newArtwork("Starry Night", "Vincent van Gogh", Set.of(oilPaint, nostalgic)),
                newArtwork("Sunflowers", "Vincent van Gogh", Set.of(oilPaint, joyful)),
                newArtwork("Untitled Sketch", "Anonymous", Set.of(watercolor, joyful))));
    }

    private static Artwork newArtwork(String title, String artist, Set<Tag> tags) {
        Artwork artwork = new Artwork();
        artwork.setTitle(title);
        artwork.setArtist(artist);
        artwork.setTags(tags);
        return artwork;
    }

    @Test
    void andsConditionsAcrossDifferentAxes() {
        Specification<Artwork> spec = Specification
                .where(ArtworkSpecifications.hasAnyTag(TagType.MEDIUM, List.of("Oil paint")))
                .and(ArtworkSpecifications.hasAnyTag(TagType.MOOD, List.of("Nostalgic")));

        assertThat(artworkRepository.findAll(spec)).extracting(Artwork::getTitle)
                .containsExactly("Starry Night");
    }

    @Test
    void orsValuesWithinTheSameAxis() {
        Specification<Artwork> spec =
                ArtworkSpecifications.hasAnyTag(TagType.MEDIUM, List.of("Oil paint", "Watercolor"));

        assertThat(artworkRepository.findAll(spec)).extracting(Artwork::getTitle)
                .containsExactlyInAnyOrder("Starry Night", "Sunflowers", "Untitled Sketch");
    }

    @Test
    void returnsNothingWhenNoArtworkSatisfiesAllAxes() {
        // Watercolor is only on Untitled Sketch (Joyful); Nostalgic is only on Starry Night (Oil paint).
        // No single artwork has both, so the AND across axes should yield an empty result.
        Specification<Artwork> spec = Specification
                .where(ArtworkSpecifications.hasAnyTag(TagType.MEDIUM, List.of("Watercolor")))
                .and(ArtworkSpecifications.hasAnyTag(TagType.MOOD, List.of("Nostalgic")));

        assertThat(artworkRepository.findAll(spec)).isEmpty();
    }

    @Test
    void returnsEverythingWhenNoAxisIsRequested() {
        Specification<Artwork> spec = Specification
                .where(ArtworkSpecifications.hasAnyTag(TagType.MEDIUM, null))
                .and(ArtworkSpecifications.hasAnyTag(TagType.MOOD, List.of()));

        assertThat(artworkRepository.findAll(spec)).hasSize(3);
    }

    @Test
    void searchMatchesTitleCaseInsensitively() {
        assertThat(artworkRepository.findAll(ArtworkSpecifications.matchesSearch("sunflower")))
                .extracting(Artwork::getTitle)
                .containsExactly("Sunflowers");
    }

    @Test
    void searchMatchesArtistCaseInsensitively() {
        assertThat(artworkRepository.findAll(ArtworkSpecifications.matchesSearch("VAN GOGH")))
                .extracting(Artwork::getTitle)
                .containsExactlyInAnyOrder("Starry Night", "Sunflowers");
    }

    @Test
    void searchWithNoMatchesReturnsEmpty() {
        assertThat(artworkRepository.findAll(ArtworkSpecifications.matchesSearch("picasso"))).isEmpty();
    }
}
