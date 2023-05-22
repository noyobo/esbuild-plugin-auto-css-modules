import
  css
  from './a.css';
import less from './a.modules.less';
import scss from './a.scss?abc=123';

import './b.css';
import './b.less';
import './b.scss';

import './require';

console.log(css, less, scss);
