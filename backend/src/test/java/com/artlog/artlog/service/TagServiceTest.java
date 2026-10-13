package com.artlog.artlog.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.artlog.artlog.graphql.TagInput;
import com.artlog.artlog.model.Artwork;
import com.artlog.artlog.model.Tag;
import com.artlog.artlog.model.TagType;
import com.artlog.artlog.repository.ArtworkRepository;
import com.artlog.artlog.repository.TagRepository;

/**
 * Covers the non-obvious business rules in {@link TagService}: renaming a tag must not collide with
 * another tag of the same name+type, and deleting a tag must detach it from every artwork rather than
 * failing on the artwork_tag foreign key.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@Import(TagServiceTest.TagServiceTestConfig.class)
class TagServiceTest {

    @TestConfiguration
    static class TagServiceTestConfig {
        @Bean
        TagService tagService(TagRepository tagRepository, ArtworkRepository artworkRepository) {
            return new TagService(tagRepository, artworkRepository);
        }
    }

    @Autowired
    private TagService tagService;

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private ArtworkRepository artworkRepository;

    @Test
    void findOrCreateAllReusesAnExistingTagInsteadOfDuplicating() {
        tagRepository.save(new Tag("Oil paint", TagType.MEDIUM));

        Set<Tag> tags = tagService.findOrCreateAll(List.of(new TagInput("Oil paint", TagType.MEDIUM)));

        assertThat(tags).hasSize(1);
        assertThat(tagRepository.findByType(TagType.MEDIUM)).hasSize(1);
    }

    @Test
    void findOrCreateAllCreatesTagsOnTheFly() {
        Set<Tag> tags = tagService.findOrCreateAll(List.of(new TagInput("Charcoal", TagType.MEDIUM)));

        assertThat(tags).extracting(Tag::getName).containsExactly("Charcoal");
        assertThat(tagRepository.findByNameAndType("Charcoal", TagType.MEDIUM)).isPresent();
    }

    @Test
    void renameTagSucceedsWhenNewNameIsFree() {
        Tag tag = tagRepository.save(new Tag("Oil paint", TagType.MEDIUM));

        Tag renamed = tagService.renameTag(tag.getId(), "Oils");

        assertThat(renamed.getName()).isEqualTo("Oils");
    }

    @Test
    void renameTagRejectsACollisionWithAnotherTagOfTheSameAxis() {
        Tag toRename = tagRepository.save(new Tag("Oil paint", TagType.MEDIUM));
        tagRepository.save(new Tag("Watercolor", TagType.MEDIUM));

        assertThatThrownBy(() -> tagService.renameTag(toRename.getId(), "Watercolor"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void renameTagAllowsTheSameNameOnADifferentAxis() {
        Tag medium = tagRepository.save(new Tag("Blue", TagType.MEDIUM));
        tagRepository.save(new Tag("Blue", TagType.COLOR));

        Tag renamed = tagService.renameTag(medium.getId(), "Blue");

        assertThat(renamed.getName()).isEqualTo("Blue");
    }

    @Test
    void deleteTagDetachesItFromArtworksInsteadOfFailing() {
        Tag tag = tagRepository.save(new Tag("Oil paint", TagType.MEDIUM));
        Artwork artwork = new Artwork();
        artwork.setTitle("Starry Night");
        artwork.setTags(Set.of(tag));
        artworkRepository.save(artwork);

        boolean deleted = tagService.deleteTag(tag.getId());

        assertThat(deleted).isTrue();
        assertThat(tagRepository.findById(tag.getId())).isEmpty();
        assertThat(artworkRepository.findById(artwork.getId()).orElseThrow().getTags()).isEmpty();
    }

    @Test
    void deleteTagReturnsFalseForAnUnknownId() {
        assertThat(tagService.deleteTag(999L)).isFalse();
    }
}
