import { render } from 'preact';
// Enable preact debug checks
import 'preact/debug';
import {
  IconButton,
  SearchIcon,
  Spinner,
} from '@hypothesis/frontend-shared/lib/next';
import classnames from 'classnames';


import { useRef } from 'preact/hooks';
import { Input } from '@hypothesis/frontend-shared/lib/next';
import SearchInput from './components/SearchInput';

import LogoIcon from './static/logo';


function App() {
  const inputRef = useRef(null);

  function setFilterQuery() {
    console.log("onSearch")
  }

  return (
  <header class="nav-bar">
    <div class="nav-bar__content">
      <a href="https://colam.kmass.cloud.edu.au/" title="Hypothesis homepage" class="nav-bar__logo-container">
        <LogoIcon />
      </a>
      <div class="nav-bar__search js-search-bar" data-ref="searchBar">
        <form class="search-bar"
              data-ref="searchBarForm"
              id="search-bar"
              action=""
              role="search">

          <input type="submit" class="nav-bar__search-hidden-input"/>

          
          <div class="search-bar__lozenges" data-ref="searchBarLozenges">

            <input class="search-bar__input js-input-autofocus"
                   aria-autocomplete="list"
                   aria-label=""
                   aria-haspopup="true"
                   autocapitalize="off"
                   autocomplete="off"
                   data-ref="searchBarInput"
                   name="q"
                   placeholder="Search…"
                   role="combobox"
                   value=""/>
            <label>
              <input type="submit" class="nav-bar__search-hidden-input"/>
              <div className="search-bar__icon">
                <SearchIcon />
              </div>
            </label>
          </div>
        </form>
      </div>

      <div class="u-stretch"></div>


    </div>
  </header>
  )
}
const container = document.querySelector('#app');

render(<App />, container);


// console.log(document, container, "2")

// render(Queryinginput, document.body);