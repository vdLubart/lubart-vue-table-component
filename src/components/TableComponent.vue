<template>
    <div class="table-component">
        <div v-if="showFilter && filterableColumnExists" class="table-component__filter ">
            <div v-if="searchComponent === null">
                <input-text
                        :class="filterInputClass"
                        name="filter"
                        :without-label="true"
                        :no-wrap="true"
                        v-model="filter"
                        :placeholder="filterPlaceholder"
                ></input-text>
                <a
                        v-if="filter"
                        @click="filter = ''"
                        class="table-component__filter__clear"
                >×</a>
            </div>
            <component v-else :is="searchComponent"></component>
        </div>

        <div class="table-component__table-wrapper">
            <div :class="fullTableClass">
                <caption v-if="showCaption" class="table-component__table__caption" role="alert" aria-live="polite">
                    {{ ariaCaption }}
                </caption>
                <div :class="fullTableHeadClass">
                    <table-column-header
                            @click="changeSorting"
                            v-for="column in columns"
                            :key="column.show"
                            :sort="sort"
                            :column="column"
                    ></table-column-header>
                </div>
                <div :class="fullTableBodyClass">
                    <table-row
                            v-for="row in displayedRows"
                            :key="row.vueTableComponentInternalRowId"
                            :row="row"
                            :columns="columns"
                    ></table-row>
                </div>
                <tfoot>
                    <slot name="tfoot" :rows="rows"></slot>
                </tfoot>
            </div>
        </div>

        <div v-if="displayedRows.length === 0" class="table-component__message">
            {{ message }}
        </div>


        <div style="display:none;">
            <slot></slot>
        </div>

        <pagination v-if="pagination" :pagination="pagination" @pageChange="pageChange"></pagination>
    </div>
</template>

<script>
    import Column from '../classes/Column';
    import expiringStorage from '../expiring-storage';
    import Row from '../classes/Row';
    import TableColumnHeader from './TableColumnHeader';
    import TableRow from './TableRow';
    import settings from '../settings';
    import Pagination from './Pagination';
    import { classList, pick } from '../helpers';
    import { InputText } from 'lubart-input-component';

    export default {
        components: {
            TableColumnHeader,
            TableRow,
            Pagination,
            InputText
        },

        props: {
            data: { default: () => [], type: [Array, Function] },

            showFilter: { default: true },
            showCaption: { default: true },

            sortBy: { default: '', type: String },
            sortOrder: { default: '', type: String },

            cacheKey: { default: null },
            cacheLifetime: { default: 5 },

            tableClass: { default: () => settings.tableClass },
            theadClass: { default: () => settings.theadClass },
            tbodyClass: { default: () => settings.tbodyClass },
            filterInputClass: { default: () => settings.filterInputClass },
            filterPlaceholder: { default: () => settings.filterPlaceholder },
            filterNoResults: { default: () => settings.filterNoResults },
            loadingResults: { default: () => settings.loadingResults },

            filterData: { default: '' },
            extraFilterData: {default: () => ({})},

            externalForm: {default: () => null},
        },

        data: () => ({
            columns: [],
            rows: [],
            filter: '',
            extraFilter: {},
            sort: {
                fieldName: '',
                order: '',
            },
            pagination: null,

            localSettings: {},

            activeRow: null,

            message: "",

            searchComponent: null
        }),

        created() {
            this.sort.fieldName = this.sortBy;
            this.sort.order = this.sortOrder;
            this.filter = this.filterData;
            this.extraFilter = this.extraFilterData;
            this.searchComponent = this.externalForm;
            this.message = this.filterNoResults;
        },

        async mounted() {
            const columnComponents = this.$slots.default
                .filter(column => column.componentInstance)
                .map(column => column.componentInstance);

            this.columns = columnComponents.map(
                column => new Column(column)
            );

            columnComponents.forEach(columnCom => {
                Object.keys(columnCom.$options.props).forEach(
                    prop => columnCom.$watch(prop, () => {
                        this.columns = columnComponents.map(
                            column => new Column(column)
                        );
                    })
                );
            });

            await this.mapDataToRows();
        },

        watch: {
            filter: 'applyFilters',

            extraFilter: {
                handler: 'applyFilters',
                deep: true
            },

            isTracked() {
                if (!this.usesLocalData) {
                    this.mapDataToRows();
                }
            },

            data() {
                if (this.usesLocalData) {
                    this.mapDataToRows();
                }
            },
        },

        computed: {
            fullTableClass() {
                return classList('table-component__table', this.tableClass);
            },

            fullTableHeadClass() {
                return classList('table-component__table__head', this.theadClass);
            },

            fullTableBodyClass() {
                return classList('table-component__table__body', this.tbodyClass);
            },

            ariaCaption() {
                if (this.sort.fieldName === '') {
                    return 'Table not sorted';
                }

                return `Table sorted by ${this.sort.fieldName} ` +
                    (this.sort.order === 'asc' ? '(ascending)' : '(descending)');
            },

            usesLocalData() {
                return Array.isArray(this.data);
            },

            displayedRows() {
                if (!this.usesLocalData) {
                    return this.sortedRows;
                }

                if (!this.showFilter) {
                    return this.sortedRows;
                }

                if (!this.columns.filter(column => column.isFilterable()).length) {
                    return this.sortedRows;
                }

                return this.sortedRows.filter(row => row.passesFilter(this.filter));
            },

            sortedRows() {
                if (!this.usesLocalData) {
                    return this.rows;
                }

                if (this.sort.fieldName === '') {
                    return this.rows;
                }

                if (this.columns.length === 0) {
                    return this.rows;
                }

                const sortColumn = this.getColumn(this.sort.fieldName);

                if (!sortColumn) {
                    return this.rows;
                }

                return this.rows.sort(sortColumn.getSortPredicate(this.sort.order, this.columns));
            },

            filterableColumnExists() {
                return this.columns.filter(c => c.isFilterable()).length > 0;
            },

            storageKey() {
                return this.cacheKey
                    ? `vue-table-component.${this.cacheKey}`
                    : `vue-table-component.${window.location.host}${window.location.pathname}${this.cacheKey}`;
            }
        },

        methods: {
            applyFilters(){
                if (!this.usesLocalData) {
                    this.mapDataToRows();
                }

                this.saveState();
            },

            async pageChange(page) {
                this.pagination.currentPage = page;

                await this.mapDataToRows();
            },

            async mapDataToRows() {
                this.message = this.loadingResults;

                const data = this.usesLocalData
                    ? this.prepareLocalData()
                    : await this.fetchServerData();

                this.message = this.filterNoResults;

                let rowId = 0;

                this.rows = data
                    .map(rowData => {
                        rowData.vueTableComponentInternalRowId = rowId++;
                        return rowData;
                    })
                    .map(rowData => new Row(rowData, this.columns));
            },

            prepareLocalData() {
                this.pagination = null;

                return this.data;
            },

            async fetchServerData() {
                const page = this.pagination && this.pagination.currentPage || 1;

                const response = await this.data({
                    filter: this.filter,
                    sort: this.sort,
                    page: page,
                    extra: this.extraFilter
                });

                this.pagination = response.pagination;

                return response.data;
            },

            async refresh() {
                await this.mapDataToRows();
            },

            changeSorting(column) {
                if (this.sort.fieldName !== column.show) {
                    this.sort.fieldName = column.show;
                    this.sort.order = 'asc';
                } else {
                    this.sort.order = (this.sort.order === 'asc' ? 'desc' : 'asc');
                }

                if (!this.usesLocalData) {
                    this.mapDataToRows();
                }

                this.saveState();
            },

            getColumn(columnName) {
                return this.columns.find(column => column.show === columnName);
            },

            saveState() {
                expiringStorage.set(this.storageKey, pick(this.$data, ['filter', 'sort']), this.cacheLifetime);
            },

            restoreState() {
                const previousState = expiringStorage.get(this.storageKey);

                if (previousState === null) {
                    return;
                }

                this.sort = previousState.sort;
                this.filter = previousState.filter;

                this.saveState();
            },

            emitRowClick(row) {
                this.$emit('row-click', row);
            }
        },
    };
</script>
