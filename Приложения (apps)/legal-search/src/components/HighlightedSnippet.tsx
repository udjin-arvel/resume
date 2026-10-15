import { Text } from 'react-native';

import type { AppColors } from '../constants/theme';
import { fonts } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { parseMarkedSnippet } from '../utils/parseMarkedSnippet';

type HighlightedSnippetProps = {
  snippet: string;
};

export function HighlightedSnippet({ snippet }: HighlightedSnippetProps) {
  const styles = useThemedStyles(createStyles);
  const segments = parseMarkedSnippet(snippet);

  return (
    <Text style={styles.base} numberOfLines={3}>
      {segments.map((segment, index) =>
        segment.highlighted ? (
          <Text key={`${index}-${segment.text}`} style={styles.mark}>
            {segment.text}
          </Text>
        ) : (
          <Text key={`${index}-${segment.text}`}>{segment.text}</Text>
        ),
      )}
    </Text>
  );
}

function createStyles(colors: AppColors) {
  return {
    base: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.inkSoft,
      fontFamily: fonts.sans,
    },
    mark: {
      backgroundColor: colors.warmSoft,
      color: colors.ink,
    },
  };
}
