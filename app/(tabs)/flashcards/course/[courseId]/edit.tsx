import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FlashcardCourseForm } from '../../_components/FlashcardCourseForm';

export default function FlashcardEditScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f5ff' }} edges={['top', 'left', 'right']}>
      <FlashcardCourseForm mode="edit" courseId={courseId} />
    </SafeAreaView>
  );
}

