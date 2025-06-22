
import { Extension } from '@tiptap/core';

export interface SearchReplaceOptions {
  searchTerm: string;
  replaceTerm: string;
  caseSensitive: boolean;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    searchReplace: {
      find: (searchTerm: string) => ReturnType;
      replace: (searchTerm: string, replaceTerm: string) => ReturnType;
      replaceAll: (searchTerm: string, replaceTerm: string) => ReturnType;
    };
  }
}

export const SearchReplaceExtension = Extension.create<SearchReplaceOptions>({
  name: 'searchReplace',

  addOptions() {
    return {
      searchTerm: '',
      replaceTerm: '',
      caseSensitive: false,
    };
  },

  addCommands() {
    return {
      find: (searchTerm: string) => ({ state, dispatch }) => {
        const { doc } = state;
        let searchIndex = -1;
        
        doc.descendants((node, pos) => {
          if (node.isText && node.text) {
            const index = this.options.caseSensitive 
              ? node.text.indexOf(searchTerm)
              : node.text.toLowerCase().indexOf(searchTerm.toLowerCase());
            
            if (index !== -1 && searchIndex === -1) {
              searchIndex = pos + index;
              return false;
            }
          }
        });

        if (searchIndex !== -1 && dispatch) {
          const tr = state.tr.setSelection({
            from: searchIndex,
            to: searchIndex + searchTerm.length,
          } as any);
          dispatch(tr);
          return true;
        }

        return false;
      },

      replace: (searchTerm: string, replaceTerm: string) => ({ state, dispatch }) => {
        const { selection } = state;
        const selectedText = state.doc.textBetween(selection.from, selection.to);
        
        const matches = this.options.caseSensitive 
          ? selectedText === searchTerm
          : selectedText.toLowerCase() === searchTerm.toLowerCase();

        if (matches && dispatch) {
          const tr = state.tr.replaceWith(selection.from, selection.to, state.schema.text(replaceTerm));
          dispatch(tr);
          return true;
        }

        return false;
      },

      replaceAll: (searchTerm: string, replaceTerm: string) => ({ state, dispatch }) => {
        const { doc } = state;
        let tr = state.tr;
        let replacements = 0;

        doc.descendants((node, pos) => {
          if (node.isText && node.text) {
            const regex = new RegExp(
              searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 
              this.options.caseSensitive ? 'g' : 'gi'
            );
            
            let match;
            const matches = [];
            while ((match = regex.exec(node.text)) !== null) {
              matches.push({
                from: pos + match.index,
                to: pos + match.index + match[0].length
              });
            }

            // Apply replacements in reverse order to maintain positions
            matches.reverse().forEach(({ from, to }) => {
              tr = tr.replaceWith(from, to, state.schema.text(replaceTerm));
              replacements++;
            });
          }
        });

        if (replacements > 0 && dispatch) {
          dispatch(tr);
          return true;
        }

        return false;
      },
    };
  },
});
