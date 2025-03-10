import { createFeatureSelector, createSelector } from '@ngrx/store';
import { LayoutUserState } from './layout-reducers';

export const getLayoutState = createFeatureSelector<LayoutUserState>('layout');

export const getLayout = createSelector(
    getLayoutState,
    (state: LayoutUserState) => state.LAYOUT
);

export const getLayoutmode = createSelector(
    getLayoutState,
    (state: LayoutUserState) => state.LAYOUT_MODE
);

export const getLayoutTheme = createSelector(
    getLayoutState,
    (state: LayoutUserState) => state.LAYOUT_THEME
);
export const getPosition = createSelector(
    getLayoutState,
    (state: LayoutUserState) => state.LAYOUT_POSITION
);

export const getLayoutWidth = createSelector(
    getLayoutState,
    (state: LayoutUserState) => state.LAYOUT_WIDTH
);

export const getTopbar = createSelector(
    getLayoutState,
    (state: LayoutUserState) => state.TOPBAR
);

export const getSidebarsize = createSelector(
    getLayoutState,
    (state: LayoutUserState) => state.SIDEBAR_SIZE
);

export const getsidebarview = createSelector(
    getLayoutState,
    (state: LayoutUserState) => state.SIDEBAR_VIEW
);

export const getsidebarimage = createSelector(
    getLayoutState,
    (state: LayoutUserState) => state.SIDEBAR_IMAGE
);

export const getSidebarcolor = createSelector(
    getLayoutState,
    (state: LayoutUserState) => state.SIDEBAR_COLOR
);

export const getPreloader = createSelector(
    getLayoutState,
    (state: LayoutUserState) => state.DATA_PRELOADER
);
