
export class ChapterNavigationService {
  private static CHAPTER_KEY = 'current_chapter_id';
  
  static setCurrentChapter(projectId: string, chapterId: string) {
    const key = `${this.CHAPTER_KEY}_${projectId}`;
    localStorage.setItem(key, chapterId);
  }
  
  static getCurrentChapter(projectId: string): string | null {
    const key = `${this.CHAPTER_KEY}_${projectId}`;
    return localStorage.getItem(key);
  }
  
  static clearCurrentChapter(projectId: string) {
    const key = `${this.CHAPTER_KEY}_${projectId}`;
    localStorage.removeItem(key);
  }
}
