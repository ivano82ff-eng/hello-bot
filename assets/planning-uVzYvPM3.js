import"./modulepreload-polyfill-P2Xu9kJm.js";var e=/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?([\s\S]*)$/;function t(e){let t={};for(let n of e.split(/\r?\n/)){let e=n.trim();if(!e||e.startsWith(`#`))continue;let r=e.match(/^([A-Za-z_][\w-]*)\s*:\s*(.+)$/);if(!r)continue;let[,i,a]=r,o=a.trim();t[i]=o===`true`?!0:o===`false`?!1:/^-?\d+(\.\d+)?$/.test(o)?Number(o):o.replace(/^['"]|['"]$/g,``)}return t}function n(e){try{return JSON.parse(e)}catch{return null}}function r(r){let i=(r??``).trim();if(!i)return{fields:{},notes:``};let a=i.match(e);if(!a)return{fields:{},notes:i};let[,o,s]=a,c=t(o);if(Object.keys(c).length)return{fields:c,notes:s.trim()};let l=n(o),u={};if(l)for(let[e,t]of Object.entries(l))(typeof t==`string`||typeof t==`number`||typeof t==`boolean`)&&(u[e]=t);return{fields:u,notes:s.trim()}}function i(e,t){let n=[`---`];for(let[t,r]of Object.entries(e))r!==void 0&&n.push(`${t}: ${r}`);return n.push(`---`),t.trim()&&n.push(``,t.trim()),n.join(`
`)}function a(e){let{fields:t,notes:n}=r(e);if(!t.course)return{meta:null,notes:n};let i=String(t.paymentStatus??`unpaid`);return{meta:{course:String(t.course),paymentStatus:i===`paid`||i===`partial`?i:`unpaid`,paymentAmount:Number(t.paymentAmount??0),photoUrl:t.photoUrl?String(t.photoUrl):void 0},notes:n}}function o(e,t){return i({course:e.course,paymentStatus:e.paymentStatus,paymentAmount:e.paymentAmount,photoUrl:e.photoUrl},t)}function s(e){let{fields:t,notes:n}=r(e);return!t.start||!t.end||!t.studentNumber?{meta:null,notes:n}:{meta:{studentNumber:Number(t.studentNumber),start:String(t.start),end:String(t.end)},notes:n}}function c(e,t){return i({studentNumber:e.studentNumber,start:e.start,end:e.end},t)}function l(e){let t=new Date(e);return t.setHours(0,0,0,0),t}function u(e){let t=new Date(e);return t.setHours(23,59,59,999),t}function d(e,t){let n=l(t),r=u(t),i=new Date(e.start),a=new Date(e.end);return i<=r&&a>=n}function f(e){let t=new Date(e),n=t.getTimezoneOffset()*6e4;return new Date(t.getTime()-n).toISOString().slice(0,16)}function p(e){return new Date(e).toISOString()}var m=`student`,h=`lesson`,ee=class{owner;repo;token;constructor(e,t,n){this.owner=e,this.repo=t,this.token=n}async listStudents(){return(await this.listIssues(m)).map(e=>this.toStudent(e)).filter(e=>e.meta!==null)}async createStudent(e){let t=await this.request(`/repos/${this.owner}/${this.repo}/issues`,{method:`POST`,body:JSON.stringify({title:e.name,body:o(e.meta,e.notes),labels:[m]})}),n=this.toStudent(t);if(!n.meta)throw Error(`Не удалось разобрать карточку ученика`);return n}async updateStudent(e){let t=await this.request(`/repos/${this.owner}/${this.repo}/issues/${e.number}`,{method:`PATCH`,body:JSON.stringify({title:e.name,body:o(e.meta,e.notes)})}),n=this.toStudent(t);if(!n.meta)throw Error(`Не удалось разобрать карточку ученика`);return n}async deleteStudent(e){await this.closeIssue(e)}async uploadStudentPhoto(e,t){let n=`students/${e}-${Date.now()}.${g(t.name)}`,r=await _(t),i=await this.getFileSha(n);return await this.request(`/repos/${this.owner}/${this.repo}/contents/${n}`,{method:`PUT`,body:JSON.stringify({message:`Фото ученика #${e}`,content:r,...i?{sha:i}:{}})}),`https://raw.githubusercontent.com/${this.owner}/${this.repo}/main/${n}`}async listLessons(){return(await this.listIssues(h)).map(e=>this.toLesson(e)).filter(e=>e.meta!==null)}async createLesson(e){let t=await this.request(`/repos/${this.owner}/${this.repo}/issues`,{method:`POST`,body:JSON.stringify({title:e.title,body:c(e.meta,e.notes),labels:[h]})}),n=this.toLesson(t);if(!n.meta)throw Error(`Не удалось разобрать занятие`);return n}async updateLesson(e){let t=await this.request(`/repos/${this.owner}/${this.repo}/issues/${e.number}`,{method:`PATCH`,body:JSON.stringify({title:e.title,body:c(e.meta,e.notes)})}),n=this.toLesson(t);if(!n.meta)throw Error(`Не удалось разобрать занятие`);return n}async deleteLesson(e){await this.closeIssue(e)}async listIssues(e){return(await this.request(`/repos/${this.owner}/${this.repo}/issues?state=all&per_page=100&labels=${e}`)).filter(e=>!e.labels.some(e=>e.name===`pull_request`))}async closeIssue(e){await this.request(`/repos/${this.owner}/${this.repo}/issues/${e}`,{method:`PATCH`,body:JSON.stringify({state:`closed`})})}async getFileSha(e){try{return(await this.request(`/repos/${this.owner}/${this.repo}/contents/${e}`)).sha}catch{return null}}toStudent(e){let{meta:t,notes:n}=a(e.body);return{id:e.id,number:e.number,name:e.title,notes:n,meta:t,state:e.state}}toLesson(e){let{meta:t,notes:n}=s(e.body);return{id:e.id,number:e.number,title:e.title,notes:n,meta:t,state:e.state}}async request(e,t){let n=await fetch(`https://api.github.com${e}`,{...t,headers:{Accept:`application/vnd.github+json`,Authorization:`Bearer ${this.token}`,"X-GitHub-Api-Version":`2022-11-28`,...t?.body?{"Content-Type":`application/json`}:{},...t?.headers}});if(!n.ok){let e=await n.text(),t=`GitHub API ${n.status}`;try{let n=JSON.parse(e);n.message&&(t=n.message)}catch{e&&(t=e)}throw Error(t)}if(n.status!==204)return await n.json()}};function g(e){let t=e.split(`.`);return t.length>1?t.at(-1).toLowerCase():`jpg`}async function _(e){let t=await e.arrayBuffer(),n=new Uint8Array(t),r=``;for(let e of n)r+=String.fromCharCode(e);return btoa(r)}var v=null,y=null,te=100,b=200;function x(e,t=0){let n=new Date;return n.setHours(e,t,0,0),n.toISOString()}function S(){return[{id:1,number:101,name:`Анна Смирнова`,notes:`Предпочитает утренние занятия.`,meta:{course:`Английский B2`,paymentStatus:`paid`,paymentAmount:15e3,photoUrl:``},state:`open`},{id:2,number:102,name:`Илья Козлов`,notes:``,meta:{course:`Математика (ЕГЭ)`,paymentStatus:`partial`,paymentAmount:8e3,photoUrl:``},state:`open`}]}function C(){let e=x(10,0),t=x(11,0),n=x(10,30),r=x(11,30);return[{id:1,number:201,title:`Занятие: Анна Смирнова`,notes:``,meta:{studentNumber:101,start:e,end:t},state:`open`},{id:2,number:202,title:`Занятие: Илья Козлов`,notes:`Перехлёст с Анной — демо`,meta:{studentNumber:102,start:n,end:r},state:`open`},{id:3,number:203,title:`Занятие: Анна Смирнова`,notes:``,meta:{studentNumber:101,start:x(14,0),end:x(15,0)},state:`open`}]}function w(){return v||=S(),v}function T(){return y||=C(),y}var E=class{async listStudents(){return await D(200),w().filter(e=>e.state===`open`)}async createStudent(e){await D(200);let t=++te,n={id:t,number:t,name:e.name,notes:e.notes,meta:e.meta,state:`open`};return w().push(n),n}async updateStudent(e){await D(200);let t=w(),n=t.findIndex(t=>t.number===e.number);if(n===-1)throw Error(`Ученик не найден`);let r={...t[n],name:e.name,notes:e.notes,meta:e.meta};return t[n]=r,r}async deleteStudent(e){await D(200);let t=w(),n=t.findIndex(t=>t.number===e);if(n===-1)throw Error(`Ученик не найден`);t[n]={...t[n],state:`closed`}}async uploadStudentPhoto(e,t){await D(150);let n=await ne(t),r=w().find(t=>t.number===e);return r&&(r.meta={...r.meta,photoUrl:n}),n}async listLessons(){return await D(200),T().filter(e=>e.state===`open`)}async createLesson(e){await D(200);let t=++b,n={id:t,number:t,title:e.title,notes:e.notes,meta:e.meta,state:`open`};return T().push(n),n}async updateLesson(e){await D(200);let t=T(),n=t.findIndex(t=>t.number===e.number);if(n===-1)throw Error(`Занятие не найдено`);let r={...t[n],title:e.title,notes:e.notes,meta:e.meta};return t[n]=r,r}async deleteLesson(e){await D(200);let t=T(),n=t.findIndex(t=>t.number===e);if(n===-1)throw Error(`Занятие не найдено`);t[n]={...t[n],state:`closed`}}};function D(e){return new Promise(t=>setTimeout(t,e))}function ne(e){return new Promise((t,n)=>{let r=new FileReader;r.onload=()=>t(String(r.result)),r.onerror=()=>n(r.error),r.readAsDataURL(e)})}function O(e){return e.demoMode||!e.token||!e.owner||!e.repo?new E:new ee(e.owner,e.repo,e.token)}function re(e,t,n,r){return e<r&&n<t}function k(e,t){return re(new Date(e.start),new Date(e.end),new Date(t.start),new Date(t.end))}function A(e,t,n){for(let r of t)if(r.state===`open`&&!(n&&r.number===n)&&k(e,r.meta))return r;return null}function j(e){let t=e.filter(e=>e.state===`open`),n=[];for(let e=0;e<t.length;e++)for(let r=e+1;r<t.length;r++)k(t[e].meta,t[r].meta)&&n.push({a:t[e].number,b:t[r].number});return n}function M(e){let t=new Set;for(let n of j(e))t.add(n.a),t.add(n.b);return t}var N=15,P=6e4,F=new Set;function I(e,t){if(!(`Notification`in window))return()=>void 0;let n=()=>{if(document.hidden||Notification.permission!==`granted`)return;let n=Date.now(),r=N*6e4;for(let i of e()){if(i.state!==`open`||F.has(i.number))continue;let e=new Date(i.meta.start).getTime()-n;if(e>0&&e<=r){let e=t().find(e=>e.number===i.meta.studentNumber);new Notification(`Скоро занятие`,{body:`${e?.name??`Ученик`} — ${R(i.meta.start)}`,tag:`lesson-${i.number}`}),F.add(i.number)}}},r=window.setInterval(n,P);return n(),()=>window.clearInterval(r)}async function L(){return`Notification`in window?Notification.permission===`granted`||Notification.permission!==`denied`&&await Notification.requestPermission()===`granted`:!1}function R(e){return new Date(e).toLocaleTimeString(`ru-RU`,{hour:`2-digit`,minute:`2-digit`})}var z=`planning-calendar-config-v1`,B={owner:``,repo:``,token:``,demoMode:!0};function V(){try{let e=localStorage.getItem(z);if(!e)return{...B};let t=JSON.parse(e);return{owner:t.owner??``,repo:t.repo??``,token:t.token??``,demoMode:t.demoMode??!t.token}}catch{return{...B}}}function H(e){localStorage.setItem(z,JSON.stringify(e))}var U=[`Пн`,`Вт`,`Ср`,`Чт`,`Пт`,`Сб`,`Вс`],W=[`Январь`,`Февраль`,`Март`,`Апрель`,`Май`,`Июнь`,`Июль`,`Август`,`Сентябрь`,`Октябрь`,`Ноябрь`,`Декабрь`],G={paid:`Оплачено`,partial:`Частично`,unpaid:`Не оплачено`},K=8,q=class{root;config;students=[];lessons=[];tab=`schedule`;viewMonth;selectedDay;editingStudent=null;editingLesson=null;modal=null;overlapMessage=null;pendingPhoto=null;loading=!1;error=null;stopReminders=null;constructor(e){this.root=e;let t=new Date;this.config=V(),this.viewMonth=new Date(t.getFullYear(),t.getMonth(),1),this.selectedDay=l(t),this.render(),this.refreshAll()}async refreshAll(){this.loading=!0,this.error=null,this.render();try{let e=O(this.config),[t,n]=await Promise.all([e.listStudents(),e.listLessons()]);this.students=t,this.lessons=n,this.startRemindersIfNeeded()}catch(e){this.error=e instanceof Error?e.message:String(e)}finally{this.loading=!1,this.render()}}startRemindersIfNeeded(){this.stopReminders?.(),this.stopReminders=I(()=>this.lessons,()=>this.students)}studentByNumber(e){return this.students.find(t=>t.number===e)}lessonsForStudent(e){return this.lessons.filter(t=>t.state===`open`&&t.meta.studentNumber===e)}lessonsForDay(e){return this.lessons.filter(t=>t.state===`open`&&d(t.meta,e))}render(){let e=M(this.lessons);this.root.innerHTML=`
      <div class="layout">
        <header class="header">
          <div>
            <p class="header__kicker">Планинг</p>
            <h1 class="header__title">Учёт учеников и расписание</h1>
          </div>
          <div class="header__actions">
            <button class="btn btn--ghost" type="button" data-action="open-settings">Настройки</button>
            <button class="btn btn--ghost" type="button" data-action="notify-permission">Напоминания</button>
            <button class="btn" type="button" data-action="refresh" ${this.loading?`disabled`:``}>
              ${this.loading?`Загрузка…`:`Обновить`}
            </button>
          </div>
        </header>

        ${this.error?`<div class="banner banner--error" role="alert">${Z(this.error)}</div>`:``}
        ${this.config.demoMode?`<div class="banner banner--info">Демо-режим: данные локальные, GitHub не вызывается. В расписании уже есть перехлёст для проверки.</div>`:``}
        ${e.size?`<div class="banner banner--warn" role="alert">⚠ Перехлёст занятий: ${e.size} занятий пересекаются по времени. Исправьте расписание.</div>`:``}

        <nav class="tabs" aria-label="Разделы">
          <button class="tab${this.tab===`students`?` tab--active`:``}" type="button" data-action="tab" data-tab="students">Ученики</button>
          <button class="tab${this.tab===`schedule`?` tab--active`:``}" type="button" data-action="tab" data-tab="schedule">Расписание</button>
        </nav>

        <main>${this.tab===`students`?this.renderStudents():this.renderSchedule(e)}</main>
      </div>
      ${this.renderModal()}
    `,this.bindEvents()}renderStudents(){return this.students.length?`
      <section class="students-toolbar">
        <button class="btn" type="button" data-action="new-student">+ Добавить ученика</button>
      </section>
      <section class="student-grid">
        ${this.students.map(e=>{let t=this.lessonsForStudent(e.number).sort((e,t)=>e.meta.start.localeCompare(t.meta.start)).slice(0,4);return`
              <article class="student-card">
                <div class="student-card__photo">
                  ${e.meta.photoUrl?`<img src="${Q(e.meta.photoUrl)}" alt="" />`:`<span class="student-card__placeholder">👤</span>`}
                </div>
                <div class="student-card__body">
                  <h2>${Z(e.name)}</h2>
                  <p class="student-card__course">${Z(e.meta.course)}</p>
                  <p class="student-card__payment payment--${e.meta.paymentStatus}">
                    ${G[e.meta.paymentStatus]} · ${ae(e.meta.paymentAmount)}
                  </p>
                  ${t.length?`<ul class="student-card__lessons">${t.map(e=>`<li>${ie(e)}</li>`).join(``)}</ul>`:`<p class="muted">Занятий пока нет</p>`}
                  <button class="btn btn--ghost" type="button" data-action="edit-student" data-number="${e.number}">Изменить</button>
                </div>
              </article>
            `}).join(``)}
      </section>
    `:`
        <section class="panel empty-panel">
          <p>Учеников пока нет.</p>
          <button class="btn" type="button" data-action="new-student">+ Добавить ученика</button>
        </section>
      `}renderSchedule(e){return`
      <div class="schedule-grid">
        <section class="panel calendar-panel" aria-label="Календарь месяца">
          <div class="calendar-nav">
            <button class="btn btn--ghost" type="button" data-action="prev-month">‹</button>
            <h2 class="calendar-nav__title">${W[this.viewMonth.getMonth()]} ${this.viewMonth.getFullYear()}</h2>
            <button class="btn btn--ghost" type="button" data-action="next-month">›</button>
          </div>
          <div class="weekdays">${U.map(e=>`<span>${e}</span>`).join(``)}</div>
          <div class="month-grid">${this.renderMonthCells()}</div>
        </section>

        <section class="panel day-panel" aria-label="Сетка дня">
          <div class="day-panel__header">
            <h2>${Y(this.selectedDay)}</h2>
            <button class="btn" type="button" data-action="new-lesson">+ Занятие</button>
          </div>
          <div class="time-grid">
            <div class="time-grid__labels">
              ${Array.from({length:14},(e,t)=>{let n=K+t;return`<span>${String(n).padStart(2,`0`)}:00</span>`}).join(``)}
            </div>
            <div class="time-grid__canvas">
              ${this.renderLessonBlocks(e)}
            </div>
          </div>
        </section>
      </div>
    `}renderMonthCells(){let e=this.viewMonth.getFullYear(),t=this.viewMonth.getMonth(),n=(new Date(e,t,1).getDay()+6)%7,r=new Date(e,t+1,0).getDate(),i=l(new Date),a=[];for(let e=0;e<n;e++)a.push(`<div class="day-cell day-cell--empty"></div>`);for(let n=1;n<=r;n++){let r=new Date(e,t,n),o=this.lessonsForDay(r).length,s=M(this.lessonsForDay(r)).size>0;a.push(`
        <button
          class="day-cell${J(r,this.selectedDay)?` day-cell--selected`:``}${J(r,i)?` day-cell--today`:``}${s?` day-cell--overlap`:``}"
          type="button"
          data-action="select-day"
          data-day="${r.toISOString()}"
        >
          <span class="day-cell__number">${n}</span>
          ${o?`<span class="day-cell__dots">${`•`.repeat(Math.min(o,3))}</span>`:``}
        </button>
      `)}return a.join(``)}renderLessonBlocks(e){let t=this.lessonsForDay(this.selectedDay);return t.length?t.map(t=>{let n=this.studentByNumber(t.meta.studentNumber),r=new Date(t.meta.start),i=new Date(t.meta.end),a=r.getHours()*60+r.getMinutes(),o=i.getHours()*60+i.getMinutes(),s=(a-480)/840*100,c=Math.max((o-a)/840*100,4),l=e.has(t.number);return`
          <button
            class="lesson-block${l?` lesson-block--overlap`:``}"
            type="button"
            data-action="edit-lesson"
            data-number="${t.number}"
            style="top:${s}%;height:${c}%"
            title="${l?`Перехлёст по времени`:``}"
          >
            <strong>${Z(n?.name??`Ученик`)}</strong>
            <span>${X(t.meta.start,t.meta.end)}</span>
            ${l?`<span class="lesson-block__warn">⚠ перехлёст</span>`:``}
          </button>
        `}).join(``):`<p class="empty-grid">На этот день занятий нет.</p>`}renderModal(){if(!this.modal)return``;if(this.modal===`overlap`)return`
        <dialog class="modal modal--danger" open>
          <div class="modal__body">
            <h2>Перехлёст занятий</h2>
            <p>${Z(this.overlapMessage??`Два занятия пересекаются по времени.`)}</p>
            <p class="hint">Сохранение заблокировано. Измените время или закройте конфликтующее занятие.</p>
            <div class="modal__actions">
              <button class="btn" type="button" data-action="close-modal">Понятно</button>
            </div>
          </div>
        </dialog>
      `;if(this.modal===`settings`)return`
        <dialog class="modal" open>
          <form class="modal__form" data-form="settings">
            <h2>Настройки GitHub</h2>
            <label>Владелец (owner)<input name="owner" value="${Q(this.config.owner)}" required /></label>
            <label>Репозиторий (repo)<input name="repo" value="${Q(this.config.repo)}" required /></label>
            <label>Fine-grained PAT<input name="token" type="password" value="${Q(this.config.token)}" autocomplete="off" /></label>
            <label class="checkbox"><input name="demoMode" type="checkbox" ${this.config.demoMode?`checked`:``} /> Демо-режим</label>
            <p class="hint">Токен в <code>localStorage</code>. Нужны права Issues и Contents (read/write) для фото.</p>
            <div class="modal__actions">
              <button class="btn btn--ghost" type="button" data-action="close-modal">Отмена</button>
              <button class="btn" type="submit">Сохранить</button>
            </div>
          </form>
        </dialog>
      `;if(this.modal===`student`){let e=this.editingStudent;return`
        <dialog class="modal" open>
          <form class="modal__form" data-form="student">
            <h2>${e?`Изменить ученика`:`Новый ученик`}</h2>
            <label>Имя<input name="name" value="${Q(e?.name??``)}" required maxlength="120" /></label>
            <label>Курс<input name="course" value="${Q(e?.meta.course??``)}" required /></label>
            <label>Статус оплаты
              <select name="paymentStatus">
                <option value="paid" ${e?.meta.paymentStatus===`paid`?`selected`:``}>Оплачено</option>
                <option value="partial" ${e?.meta.paymentStatus===`partial`?`selected`:``}>Частично</option>
                <option value="unpaid" ${!e||e.meta.paymentStatus===`unpaid`?`selected`:``}>Не оплачено</option>
              </select>
            </label>
            <label>Сумма (₽)<input name="paymentAmount" type="number" min="0" step="100" value="${e?.meta.paymentAmount??0}" /></label>
            <label>Фото<input name="photo" type="file" accept="image/*" /></label>
            <label>Заметки<textarea name="notes" rows="3">${Z(e?.notes??``)}</textarea></label>
            <div class="modal__actions">
              <button class="btn btn--ghost" type="button" data-action="close-modal">Отмена</button>
              <button class="btn" type="submit">${e?`Сохранить`:`Создать`}</button>
            </div>
          </form>
        </dialog>
      `}let e=this.editingLesson,t=e?.meta.studentNumber??this.students[0]?.number??0,n=e?f(e.meta.start):oe(this.selectedDay),r=e?f(e.meta.end):se(this.selectedDay);return`
      <dialog class="modal" open>
        <form class="modal__form" data-form="lesson">
          <h2>${e?`Изменить занятие`:`Новое занятие`}</h2>
          <label>Ученик
            <select name="studentNumber" required>
              ${this.students.map(e=>`<option value="${e.number}" ${e.number===t?`selected`:``}>${Z(e.name)}</option>`).join(``)}
            </select>
          </label>
          <label>Начало<input name="start" type="datetime-local" value="${Q(n)}" required /></label>
          <label>Конец<input name="end" type="datetime-local" value="${Q(r)}" required /></label>
          <label>Заметки<textarea name="notes" rows="3">${Z(e?.notes??``)}</textarea></label>
          <div class="modal__actions">
            ${e?`<button class="btn btn--danger" type="button" data-action="delete-lesson" data-number="${e.number}">Удалить</button>`:``}
            <button class="btn btn--ghost" type="button" data-action="close-modal">Отмена</button>
            <button class="btn" type="submit">${e?`Сохранить`:`Создать`}</button>
          </div>
        </form>
      </dialog>
    `}bindEvents(){this.root.querySelector(`[data-action="refresh"]`)?.addEventListener(`click`,()=>void this.refreshAll()),this.root.querySelector(`[data-action="open-settings"]`)?.addEventListener(`click`,()=>{this.modal=`settings`,this.render()}),this.root.querySelector(`[data-action="notify-permission"]`)?.addEventListener(`click`,()=>{L().then(e=>{this.error=e?null:`Разрешите уведомления в браузере для напоминаний при открытой вкладке.`,this.render()})}),this.root.querySelector(`[data-action="close-modal"]`)?.addEventListener(`click`,()=>{this.modal===`overlap`?(this.modal=`lesson`,this.overlapMessage=null):(this.modal=null,this.editingStudent=null,this.editingLesson=null,this.pendingPhoto=null),this.render()}),this.root.querySelectorAll(`[data-action="tab"]`).forEach(e=>{e.addEventListener(`click`,()=>{this.tab=e.dataset.tab,this.render()})}),this.root.querySelector(`[data-action="new-student"]`)?.addEventListener(`click`,()=>{this.editingStudent=null,this.modal=`student`,this.render()}),this.root.querySelectorAll(`[data-action="edit-student"]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=Number(e.dataset.number);this.editingStudent=this.students.find(e=>e.number===t)??null,this.modal=`student`,this.render()})}),this.root.querySelector(`[data-action="new-lesson"]`)?.addEventListener(`click`,()=>{if(!this.students.length){this.error=`Сначала добавьте хотя бы одного ученика.`,this.render();return}this.editingLesson=null,this.modal=`lesson`,this.render()}),this.root.querySelectorAll(`[data-action="edit-lesson"]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=Number(e.dataset.number);this.editingLesson=this.lessons.find(e=>e.number===t)??null,this.modal=`lesson`,this.render()})}),this.root.querySelector(`[data-action="prev-month"]`)?.addEventListener(`click`,()=>{this.viewMonth=new Date(this.viewMonth.getFullYear(),this.viewMonth.getMonth()-1,1),this.render()}),this.root.querySelector(`[data-action="next-month"]`)?.addEventListener(`click`,()=>{this.viewMonth=new Date(this.viewMonth.getFullYear(),this.viewMonth.getMonth()+1,1),this.render()}),this.root.querySelectorAll(`[data-action="select-day"]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.day;t&&(this.selectedDay=l(new Date(t)),this.render())})});let e=this.root.querySelector(`form[data-form="settings"]`);e?.addEventListener(`submit`,t=>{t.preventDefault();let n=new FormData(e);this.config={owner:String(n.get(`owner`)??``).trim(),repo:String(n.get(`repo`)??``).trim(),token:String(n.get(`token`)??``).trim(),demoMode:n.get(`demoMode`)===`on`},H(this.config),this.modal=null,this.refreshAll()});let t=this.root.querySelector(`form[data-form="student"]`);t?.addEventListener(`submit`,e=>{e.preventDefault(),this.submitStudentForm(t)}),t?.querySelector(`input[name="photo"]`)?.addEventListener(`change`,e=>{let t=e.target;this.pendingPhoto=t.files?.[0]??null});let n=this.root.querySelector(`form[data-form="lesson"]`);n?.addEventListener(`submit`,e=>{e.preventDefault(),this.submitLessonForm(n)}),this.root.querySelector(`[data-action="delete-lesson"]`)?.addEventListener(`click`,()=>{this.editingLesson&&this.deleteLesson(this.editingLesson.number)})}async submitStudentForm(e){let t=new FormData(e),n={name:String(t.get(`name`)??``).trim(),notes:String(t.get(`notes`)??``).trim(),meta:{course:String(t.get(`course`)??``).trim(),paymentStatus:String(t.get(`paymentStatus`)??`unpaid`),paymentAmount:Number(t.get(`paymentAmount`)??0),photoUrl:this.editingStudent?.meta.photoUrl}};this.loading=!0,this.render();try{let e=O(this.config),t;if(t=this.editingStudent?await e.updateStudent({...n,number:this.editingStudent.number}):await e.createStudent(n),this.pendingPhoto){let r=await e.uploadStudentPhoto(t.number,this.pendingPhoto);t=await e.updateStudent({...n,number:t.number,meta:{...n.meta,photoUrl:r}})}this.modal=null,this.editingStudent=null,this.pendingPhoto=null,await this.refreshAll()}catch(e){this.error=e instanceof Error?e.message:String(e),this.loading=!1,this.render()}}async submitLessonForm(e){let t=new FormData(e),n=Number(t.get(`studentNumber`)),r=this.studentByNumber(n),i={studentNumber:n,start:p(String(t.get(`start`))),end:p(String(t.get(`end`)))},a=A(i,this.lessons,this.editingLesson?.number);if(a){let e=this.studentByNumber(a.meta.studentNumber);this.overlapMessage=`Занятие «${r?.name??`ученик`}» (${X(i.start,i.end)}) пересекается с «${e?.name??`учеником`}» (${X(a.meta.start,a.meta.end)}).`,this.modal=`overlap`,this.render();return}let o={title:`Занятие: ${r?.name??`Ученик`}`,notes:String(t.get(`notes`)??``).trim(),meta:i};this.loading=!0,this.render();try{let e=O(this.config);this.editingLesson?await e.updateLesson({...o,number:this.editingLesson.number}):await e.createLesson(o),this.modal=null,this.editingLesson=null,await this.refreshAll()}catch(e){this.error=e instanceof Error?e.message:String(e),this.loading=!1,this.render()}}async deleteLesson(e){if(confirm(`Удалить занятие (issue будет закрыт)?`)){this.loading=!0,this.render();try{await O(this.config).deleteLesson(e),this.modal=null,this.editingLesson=null,await this.refreshAll()}catch(e){this.error=e instanceof Error?e.message:String(e),this.loading=!1,this.render()}}}};function J(e,t){return e.getFullYear()===t.getFullYear()&&e.getMonth()===t.getMonth()&&e.getDate()===t.getDate()}function Y(e){return e.toLocaleDateString(`ru-RU`,{weekday:`long`,day:`numeric`,month:`long`,year:`numeric`})}function X(e,t){let n={hour:`2-digit`,minute:`2-digit`};return`${new Date(e).toLocaleTimeString(`ru-RU`,n)} – ${new Date(t).toLocaleTimeString(`ru-RU`,n)}`}function ie(e){return`${new Date(e.meta.start).toLocaleDateString(`ru-RU`,{day:`numeric`,month:`short`})} ${X(e.meta.start,e.meta.end)}`}function ae(e){return new Intl.NumberFormat(`ru-RU`).format(e)+` ₽`}function oe(e){let t=new Date(e);t.setHours(10,0,0,0);let n=t.getTimezoneOffset()*6e4;return new Date(t.getTime()-n).toISOString().slice(0,16)}function se(e){let t=new Date(e);t.setHours(11,0,0,0);let n=t.getTimezoneOffset()*6e4;return new Date(t.getTime()-n).toISOString().slice(0,16)}function Z(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`)}function Q(e){return Z(e).replaceAll(`'`,`&#39;`)}var $=document.getElementById(`app`);if(!$)throw Error(`Не найден корневой элемент #app`);new q($);