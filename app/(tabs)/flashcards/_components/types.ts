export type FlashcardQuiz = {
  quizzes_id?: number;
  definition: string;
  mota: string;
  image?: string | null;
  mediaFile?: {
    uri: string;
    name: string;
    type: string;
  } | null;
  mediaType?: 'image' | 'video' | null;
  isModified?: boolean;
};

export type FlashcardCourse = {
  course_id?: number;
  title: string;
  description: string;
  nameschool?: string | null;
  namecourse?: string | null;
  quizzes: FlashcardQuiz[];
};

const flashcardTypesModule = {};
export default flashcardTypesModule;

