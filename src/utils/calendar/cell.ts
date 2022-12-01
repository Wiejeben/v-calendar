import { ComputedRef, Ref, computed, reactive, ref } from 'vue';
import { CalendarDay } from '../page';
import { roundTenth } from '../helpers';
import { MS_PER_HOUR } from '../date/helpers';
import { DateRange } from '../date/range';
import { Event } from './event';

export type CellSize = '2xs' | 'xs' | 'sm' | 'md';

interface CellContext {
  isMonthly: ComputedRef<boolean>;
  isDaily: ComputedRef<boolean>;
}

interface DayCellContext extends CellContext {
  day: CalendarDay;
  pixelsPerHour: Ref<number>;
}

interface WeekCellContext extends CellContext {
  days: CalendarDay[];
}

export interface Cell {
  event: Event;
  key: string | number;
  color: string;
  fill: string;
  allDay: boolean;
  isMultiDay: boolean;
  isWeekly: boolean;
  selected: boolean;
  resizable: boolean;
  resizableHorizontal: boolean;
  resizableVertical: boolean;
  size: CellSize;
  is2xs: boolean;
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  style: any;
  summary: string;
  dateLabel: string;
  resizing: boolean;
  dragging: boolean;
}

function createCell(event: Event, size: Ref<CellSize>, ctx: CellContext) {
  const key = computed(() => event.key);
  const color = computed(() => event.color);

  const allDay = computed(() => event.allDay);
  const isMultiDay = computed(() => event.isMultiDay);
  const isWeekly = computed(() => event.isWeekly);

  const summary = computed(() => event.summary);
  const dateLabel = computed(() => {
    if (isXs.value) return event.startDateLabel;
    return `${event.startDateLabel} - ${event.endDateLabel}`;
  });

  const selected = computed(() => event.selected);

  const resizable = computed(() => event.resizable);
  const resizableHorizontal = computed(() => {
    if (!event.resizable) return false;
    if (ctx.isDaily.value) return false;
    if (ctx.isMonthly.value) return true;
    if (event.isWeekly) return true;
    return false;
  });
  const resizableVertical = computed(() => {
    if (!event.resizable) return false;
    if (ctx.isMonthly.value) return false;
    if (event.isWeekly) return false;
    return true;
  });

  const is2xs = computed(() => ['2xs'].includes(size.value));
  const isXs = computed(() => ['2xs', 'xs'].includes(size.value));
  const isSm = computed(() => ['2xs', 'xs', 'sm'].includes(size.value));
  const isMd = computed(() => ['2xs', 'xs', 'sm', 'md'].includes(size.value));

  const resizing = computed(() => event.resizing);
  const dragging = computed(() => event.dragging);

  return {
    key,
    color,
    allDay,
    isMultiDay,
    isWeekly,
    summary,
    dateLabel,
    selected,
    resizable,
    resizableHorizontal,
    resizableVertical,
    is2xs,
    isXs,
    isSm,
    isMd,
    resizing,
    dragging,
  };
}

export function createDayCell(event: Event, ctx: DayCellContext) {
  const { day, pixelsPerHour } = ctx;

  const position = computed(() => {
    const { start } = event.range;
    const { range } = day;
    const dayStartTime = range.start.getTime();
    const yHours = (start!.dateTime - dayStartTime) / MS_PER_HOUR;
    return Math.max(roundTenth(yHours * pixelsPerHour.value), 0);
  });

  const height = computed(() => {
    const { start, end } = event.range;
    const heightHours = (end!.dateTime - start!.dateTime) / MS_PER_HOUR;
    const fullHeight = 24 * pixelsPerHour.value;
    return Math.max(
      Math.min(heightHours * pixelsPerHour.value, fullHeight - position.value),
      0,
    );
  });

  const size = computed<CellSize>(() => {
    if (height.value <= 16) return '2xs';
    if (height.value <= 30) return 'xs';
    if (height.value <= 48) return 'sm';
    return 'md';
  });

  const style = computed(() => {
    return {
      top: `${position.value}px`,
      height: `${height.value}px`,
    };
  });

  const fill = computed(() => event.fill);

  return reactive({
    ...createCell(event, size, ctx),
    event,
    size,
    style,
    fill,
  });
}

export function createWeekCell(event: Event, ctx: WeekCellContext) {
  const { days } = ctx;

  const range = computed(() =>
    DateRange.from({
      start: days[0].range.start,
      end: days[days.length - 1].range.end,
    }),
  );

  const size = ref<CellSize>('2xs');

  const style = computed(() => {
    if (!range.value.intersectsRange(event.range)) return '';
    let gridColumnStart = 1;
    let gridColumnEnd = days.length + 1;
    const { start, end } = event.range;

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      if (start != null) {
        if (day.range.start <= start.date && day.range.end >= start.date) {
          gridColumnStart = i + 1;
        }
      }
      if (end != null) {
        if (day.range.start <= end.date && day.range.end >= end.date) {
          gridColumnEnd = i + 2;
        }
      }
    }
    return {
      gridColumnStart,
      gridColumnEnd,
    };
  });

  const fill = computed(() => {
    if (ctx.isMonthly && !event.isWeekly) return 'transparent';
    return event.fill;
  });

  return reactive({
    ...createCell(event, size, ctx),
    event,
    size,
    style,
    fill,
  });
}
