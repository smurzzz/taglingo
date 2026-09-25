import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import { SkeletonList } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useDefinition } from '@/features/words/api';
import type { Word } from '@/mocks/words';

function SheetRow({
  icon,
  label,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  children: React.ReactNode;
}) {
  const theme = useThemeColors();
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={16} color={theme.mutedForeground} style={styles.rowIcon} />
      <View style={styles.rowBody}>
        <AppText variant="overline" muted>
          {label}
        </AppText>
        <View style={styles.rowContent}>{children}</View>
      </View>
    </View>
  );
}

/**
 * Definition Lookup bottom sheet (functionality prompt §5). Loading while the
 * (mock) request is in flight; a `{ found: false }` response renders the
 * graceful "no definition" state, never a generic error screen.
 */
export function DefinitionSheet({
  word,
  favorite,
  visible,
  onToggleFavorite,
  onClose,
}: {
  word: Word | undefined;
  favorite: boolean;
  visible: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
}) {
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const definition = useDefinition(visible ? word?.id : undefined);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Close definition" style={styles.backdropPress} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.card,
              paddingBottom: Math.max(insets.bottom, Spacing.six) + Spacing.two,
            },
          ]}
        >
          {word ? (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <AppText variant="display" bold style={styles.title}>
                    {word.cebuano}
                  </AppText>
                  <View style={styles.subtitle}>
                    <StatusBadge variant="mastered" uppercase />
                    <AppText variant="label" muted>
                      Tagalog: {word.tagalog}
                    </AppText>
                  </View>
                </View>
                <View style={styles.headerActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={favorite ? 'Remove from favorites' : 'Save to favorites'}
                    onPress={onToggleFavorite}
                    hitSlop={8}
                    style={styles.headerIcon}
                  >
                    <Ionicons
                      name={favorite ? 'bookmark' : 'bookmark-outline'}
                      size={20}
                      color={favorite ? theme.coral : theme.mutedForeground}
                    />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    onPress={onClose}
                    hitSlop={8}
                    style={styles.headerIcon}
                  >
                    <Ionicons name="close" size={22} color={theme.mutedForeground} />
                  </Pressable>
                </View>
              </View>

              {definition.isPending ? (
                <SkeletonList rows={3} />
              ) : definition.data && !definition.data.found ? (
                <View style={[styles.notFound, { borderColor: theme.border }]}>
                  <Ionicons name="search-outline" size={20} color={theme.mutedForeground} />
                  <AppText variant="label" muted center>
                    No definition available for this word right now.
                  </AppText>
                </View>
              ) : (
                <View style={styles.rows}>
                  <SheetRow icon="book-outline" label="English">
                    <AppText variant="label">{word.english}</AppText>
                  </SheetRow>
                  <SheetRow icon="text-outline" label="Part of speech">
                    <AppText variant="label">{word.partOfSpeech}</AppText>
                  </SheetRow>
                  <SheetRow icon="information-circle-outline" label="Definition">
                    <AppText variant="label">{word.definition}</AppText>
                  </SheetRow>
                  <SheetRow icon="chatbubble-ellipses-outline" label="Example">
                    <AppText variant="label" style={styles.italic}>
                      {word.example.text}
                    </AppText>
                    <AppText variant="label" muted style={styles.exampleEnglish}>
                      {word.example.english}
                    </AppText>
                  </SheetRow>
                </View>
              )}

              {definition.isError ? (
                <Button variant="outline" size="sm" onPress={() => definition.refetch()}>
                  Try again
                </Button>
              ) : null}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(14, 22, 27, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropPress: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    maxHeight: '85%',
    paddingHorizontal: Spacing.six,
    paddingTop: Spacing.three,
  },
  content: {
    gap: Spacing.five,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: Spacing.two,
  },
  title: {
    fontSize: 28,
  },
  subtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerIcon: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  rows: {
    gap: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three + 2,
  },
  rowIcon: {
    marginTop: 2,
  },
  rowBody: {
    flex: 1,
    gap: Spacing.one,
  },
  rowContent: {
    gap: Spacing.one,
  },
  italic: {
    fontStyle: 'italic',
  },
  exampleEnglish: {
    marginTop: Spacing.one,
  },
  notFound: {
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    padding: Spacing.five,
  },
});
