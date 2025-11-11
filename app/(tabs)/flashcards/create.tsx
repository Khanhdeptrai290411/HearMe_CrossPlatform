import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FlashcardCourseForm } from './_components/FlashcardCourseForm';

export default function FlashcardCreateScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f5ff' }} edges={['top', 'left', 'right']}>
      <FlashcardCourseForm mode="create" />
    </SafeAreaView>
  );
}

