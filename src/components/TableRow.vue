<template>
    <div :class="{ 'table-component__active_row': this.isActive }" class="table-component__row" @click="emitRowClick">
        <table-cell
            v-for="column in visibleColumns"
            :row="row"
            :column="column"
            :key="column.id"
        ></table-cell>
    </div>
</template>

<script>
    import TableCell from './TableCell';

    export default {
        props: ['columns', 'row'],

        data: () => {
            return {isActive: false}
        },

        components: {
            TableCell,
        },

        computed: {
            visibleColumns() {
                return this.columns.filter(column => ! column.hidden);
            },

            rowId(){
                return this.row.data.rowId;
            }
        },

        methods: {
            emitRowClick(row) {
                this.$parent.emitRowClick(this);
            }
        }
    };
</script>
