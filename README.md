# A straightforward Vue component to filter and sort tables

This component extends friezed component `vue-table-component` from [Spatie](https://www.npmjs.com/package/vue-table-component).
Current implementation makes table responsible, highlights the active hovered rows.

## Installation

To install the component run:

```bash
$ npm i lubart-vue-table-component --save
```

This installs `vue-table-component` as a dependency as well.

Next, you must register the component in the app.js (or similar) file.
The most common use case is to do that globally.

```bash
//in your app.js or similar file
import Vue from 'vue';
import { TableComponent, TableColumn } from 'lubart-vue-table-component';
import 'lubart-vue-table-component/src/css/styles.scss';

Vue.component('table-component', TableComponent);
Vue.component('table-column', TableColumn);
```

## Usage

The usage of this component is strictly follows usage of the [vue-table-component](https://www.npmjs.com/package/vue-table-component#usage).
Additionally `table-component` has one more additional property:
 - `filter-data`: preset filter value on loading page.  

### Listeners

Custom `@rowClick` event was replaced by `@row-click`. Event can be fired as follow:

```bash
<template>
   <div id="app">
        <table-component
            :data="fetchData"
            @row-click="activateRow"
            >
            <table-column show="firstName" label="First name"></table-column>
            <table-column show="lastName" label="Last name"></table-column>
        </table-component>
   </div>
</template>

<script>
    export default {
        methods: {
            activateRow(row){
                this.$children.forEach((component) => {
                    component.$children.forEach((row) => {
                        row.isActive = false;
                    });
                });
                row.isActive = true;
            }
        }
    }
</script>
```

### Custom filter form

Custom filter form can be included to the table component in place of the default 'Quick
search' field. Custom filter form should be an external component created in the 
project and imported through the property `external-form` like follow:

```Javasctipt
//app.js

...

import TableComponent from 'lubart-vue-table-component';
import CustomSearchForm from './components/CustomSearchForm';

TableComponent.install(Vue);

new Vue({
    el: "#app",

    data() {
        return {
            externalSearchForms: {
                page: LogSearchForm
            }
        }
    },
    
    ...
});
...
```

and then in the view file:

```html
// page.blade.php

<table-component
        :data="fetchData"
        filter-placeholder="Quick search..."
        filter-data="{{ $filter }}"
        :external-form="externalSearchForms.page"
>
...
</table-component>
```


Custom filter form overrides 'Quick search' field, so this field also should included
to the custom component if it is needed. Each custom form element may binds directly 
`table-component` values `filter` and `extraFilter`. Here is custom form template:

```html

<div>
    <input-date placeholder="Choose Date"
            name="date"
            v-model="$parent.extraFilter.date"
    >
    </input-date>
    
    <input-text
            :class="$parent.filterInputClass"
            name="filter"
            :without-label="true"
            :no-wrap="true"
            v-model="$parent.filter"
            :placeholder="$parent.filterPlaceholder"
    ></input-text>
    <a
            v-if="$parent.filter"
            @click="$parent.filter = ''"
            class="table-component__filter__clear"
    >×</a>
</div>

```
