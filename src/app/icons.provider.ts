import { Provider } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  ionHome,
  ionBook,
  ionGolf,
  ionAdd,
  ionChevronForward,
  ionChevronBack,
  ionChevronDown,
  ionCreate,
  ionCalendarClear,
  ionCheckmark,
  ionCaretUp,
  ionCaretDown,
  ionArrowForward,
  ionCaretForward,
  ionSettings,
} from '@ng-icons/ionicons';

export const iconsProvider: Provider[] = provideIcons({
  ionHome,
  ionBook,
  ionGolf,
  ionAdd,
  ionChevronForward,
  ionChevronBack,
  ionChevronDown,
  ionCreate,
  ionCalendarClear,
  ionCheckmark,
  ionCaretUp,
  ionCaretDown,
  ionArrowForward,
  ionCaretForward,
  ionSettings,
});
