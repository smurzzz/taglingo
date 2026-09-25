import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import type { Word } from '@/mocks/words';

/**
 * The study flashcard. Tap to flip between the Cebuano/Tagalog face and the
 * English face; rotateY is driven with the RN Animated API and each face
 * hides its back side.
 */
export function WordCard({
  word,
  flipped,
  favorite,
  onFlip,
  onToggleFavorite,
  onOpenDefinition,
}: {
  word: Word;
  flipped: boolean;
  favorite: boolean;
  onFlip: () => void;
  onToggleFavorite: () => void;
  onOpenDefinition: () => void;
}) {
  const theme = useThemeColors();
  const [rotate] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(rotate, {
      toValue: flipped ? 1 : 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [flipped, rotate]);

  const frontRotate = useMemo(
    () =>
      rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
      }),
    [rotate],
  );
  const backRotate = useMemo(
    () =>
      rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['180deg', '360deg'],
      }),
    [rotate],
  );

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.card, { transform: [{ rotateY: frontRotate }] }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Flashcard — tap to flip"
          onPress={onFlip}
          style={[styles.face, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <AppText variant="overline" muted style={styles.faceLabel}>
            Cebuano
          </AppText>
          <AppText variant="hero" bold center style={styles.headword}>
            {word.cebuano}
          </AppText>
          <AppText variant="label" muted>
            Tagalog: {word.tagalog}
          </AppText>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={favorite ? 'Remove from favorites' : 'Save to favorites'}
            onPress={onToggleFavorite}
            hitSlop={8}
            style={[
              styles.bookmark,
              {
                backgroundColor: favorite ? theme.coralSoft : theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons
              name={favorite ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={favorite ? theme.coral : theme.mutedForeground}
            />
          </Pressable>

          <View style={styles.flipHint}>
            <View style={[styles.hintLine, { backgroundColor: theme.border }]} />
            <AppText variant="caption" muted>
              Tap to flip
            </AppText>
          </View>
        </Pressable>
      </Animated.View>

      <Animated.View
        pointerEvents={flipped ? 'auto' : 'none'}
        style={[
          styles.card,
          styles.cardBack,
          { transform: [{ rotateY: backRotate }] },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Flashcard back — tap to flip"
          onPress={onFlip}
          style={[styles.face, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <AppText variant="overline" muted style={styles.faceLabel}>
            English
          </AppText>
          <AppText variant="display" bold center style={styles.english}>
            {word.english}
          </AppText>
          {word.partOfSpeech ? (
            <AppText variant="overline" muted>
              {word.partOfSpeech}
            </AppText>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="See definition and example"
            onPress={onOpenDefinition}
            style={[styles.definitionButton, { borderColor: theme.border }]}
          >
            <AppText variant="caption" color="primary" bold>
              See definition &amp; example
            </AppText>
          </Pressable>

          <View style={styles.flipHint}>
            <View style={[styles.hintLine, { backgroundColor: theme.border }]} />
            <AppText variant="caption" muted>
              Tap to flip back
            </AppText>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 320,
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    backfaceVisibility: 'hidden',
  },
  face: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.six,
    gap: Spacing.three,
  },
  faceLabel: {
    fontSize: 11,
  },
  headword: {
    fontSize: 40,
    lineHeight: 46,
  },
  english: {
    fontSize: 30,
    lineHeight: 36,
  },
  bookmark: {
    position: 'absolute',
    top: Spacing.four,
    right: Spacing.four,
    height: 40,
    width: 40,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  definitionButton: {
    marginTop: Spacing.four,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  flipHint: {
    position: 'absolute',
    bottom: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  hintLine: {
    height: 1,
    width: 24,
  },
});
