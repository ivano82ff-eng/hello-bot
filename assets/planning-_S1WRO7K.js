import"./modulepreload-polyfill-P2Xu9kJm.js";var e=/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?([\s\S]*)$/;function t(e){let t={};for(let n of e.split(/\r?\n/)){let e=n.trim();if(!e||e.startsWith(`#`))continue;let r=e.match(/^([A-Za-z_][\w-]*)\s*:\s*(.+)$/);if(!r)continue;let[,i,a]=r,o=a.trim();t[i]=o===`true`?!0:o===`false`?!1:/^-?\d+(\.\d+)?$/.test(o)?Number(o):o.replace(/^['"]|['"]$/g,``)}return t}function n(e){try{return JSON.parse(e)}catch{return null}}function r(r){let i=(r??``).trim();if(!i)return{fields:{},notes:``};let a=i.match(e);if(!a)return{fields:{},notes:i};let[,o,s]=a,c=t(o);if(Object.keys(c).length)return{fields:c,notes:s.trim()};let l=n(o),u={};if(l)for(let[e,t]of Object.entries(l))(typeof t==`string`||typeof t==`number`||typeof t==`boolean`)&&(u[e]=t);return{fields:u,notes:s.trim()}}function i(e,t){let n=[`---`];for(let[t,r]of Object.entries(e))r!==void 0&&n.push(`${t}: ${r}`);return n.push(`---`),t.trim()&&n.push(``,t.trim()),n.join(`
`)}function a(e){let{fields:t,notes:n}=r(e);if(!t.course)return{meta:null,notes:n};let i=String(t.paymentStatus??`unpaid`);return{meta:{course:String(t.course),paymentStatus:i===`paid`||i===`partial`?i:`unpaid`,paymentAmount:Number(t.paymentAmount??0),photoUrl:t.photoUrl?String(t.photoUrl):void 0},notes:n}}function o(e,t){return i({course:e.course,paymentStatus:e.paymentStatus,paymentAmount:e.paymentAmount,photoUrl:e.photoUrl},t)}function s(e){let{fields:t,notes:n}=r(e);return!t.start||!t.end||!t.studentNumber?{meta:null,notes:n}:{meta:{studentNumber:Number(t.studentNumber),start:String(t.start),end:String(t.end)},notes:n}}function c(e,t){return i({studentNumber:e.studentNumber,start:e.start,end:e.end},t)}function l(e){let t=new Date(e);return t.setHours(0,0,0,0),t}function u(e){let t=new Date(e);return t.setHours(23,59,59,999),t}function d(e,t){let n=l(t),r=u(t),i=new Date(e.start),a=new Date(e.end);return i<=r&&a>=n}function f(e){let t=new Date(e),n=t.getTimezoneOffset()*6e4;return new Date(t.getTime()-n).toISOString().slice(0,16)}function p(e){return new Date(e).toISOString()}var m=`student`,h=`lesson`,ee=class{owner;repo;token;assetsOwner;assetsRepo;defaultBranch=null;constructor(e,t,n,r,i){this.owner=e,this.repo=t,this.token=n,this.assetsOwner=r,this.assetsRepo=i}async listStudents(){return(await this.listIssues(m)).map(e=>this.toStudent(e)).filter(e=>e.meta!==null)}async createStudent(e){let t=await this.request(`/repos/${this.owner}/${this.repo}/issues`,{method:`POST`,body:JSON.stringify({title:e.name,body:o(e.meta,e.notes),labels:[m]})}),n=this.toStudent(t);if(!n.meta)throw Error(`Не удалось разобрать карточку ученика`);return n}async updateStudent(e){let t=await this.request(`/repos/${this.owner}/${this.repo}/issues/${e.number}`,{method:`PATCH`,body:JSON.stringify({title:e.name,body:o(e.meta,e.notes)})}),n=this.toStudent(t);if(!n.meta)throw Error(`Не удалось разобрать карточку ученика`);return n}async deleteStudent(e){await this.closeIssue(e)}async uploadStudentPhoto(e,t){let n=await this.getDefaultBranch(this.assetsOwner,this.assetsRepo),r=`students/${e}-${Date.now()}.${te(t.name)}`,i=await ne(t),a=await this.getFileSha(this.assetsOwner,this.assetsRepo,r);return await this.request(`/repos/${this.assetsOwner}/${this.assetsRepo}/contents/${r}`,{method:`PUT`,body:JSON.stringify({message:`Фото ученика #${e}`,content:i,branch:n,...a?{sha:a}:{}})}),`https://raw.githubusercontent.com/${this.assetsOwner}/${this.assetsRepo}/${n}/${r}`}async listLessons(){return(await this.listIssues(h)).map(e=>this.toLesson(e)).filter(e=>e.meta!==null)}async createLesson(e){let t=await this.request(`/repos/${this.owner}/${this.repo}/issues`,{method:`POST`,body:JSON.stringify({title:e.title,body:c(e.meta,e.notes),labels:[h]})}),n=this.toLesson(t);if(!n.meta)throw Error(`Не удалось разобрать занятие`);return n}async updateLesson(e){let t=await this.request(`/repos/${this.owner}/${this.repo}/issues/${e.number}`,{method:`PATCH`,body:JSON.stringify({title:e.title,body:c(e.meta,e.notes)})}),n=this.toLesson(t);if(!n.meta)throw Error(`Не удалось разобрать занятие`);return n}async deleteLesson(e){await this.closeIssue(e)}async listIssues(e){return(await this.request(`/repos/${this.owner}/${this.repo}/issues?state=all&per_page=100&labels=${e}`)).filter(e=>!e.labels.some(e=>e.name===`pull_request`))}async closeIssue(e){await this.request(`/repos/${this.owner}/${this.repo}/issues/${e}`,{method:`PATCH`,body:JSON.stringify({state:`closed`})})}async getDefaultBranch(e,t){if(e===this.assetsOwner&&t===this.assetsRepo&&this.defaultBranch)return this.defaultBranch;let n=await this.request(`/repos/${e}/${t}`);return e===this.assetsOwner&&t===this.assetsRepo&&(this.defaultBranch=n.default_branch),n.default_branch}async getFileSha(e,t,n){try{return(await this.request(`/repos/${e}/${t}/contents/${n}`)).sha}catch{return null}}toStudent(e){let{meta:t,notes:n}=a(e.body);return{id:e.id,number:e.number,name:e.title,notes:n,meta:t,state:e.state}}toLesson(e){let{meta:t,notes:n}=s(e.body);return{id:e.id,number:e.number,title:e.title,notes:n,meta:t,state:e.state}}async request(e,t){let n=await fetch(`https://api.github.com${e}`,{...t,headers:{Accept:`application/vnd.github+json`,Authorization:`Bearer ${this.token}`,"X-GitHub-Api-Version":`2022-11-28`,...t?.body?{"Content-Type":`application/json`}:{},...t?.headers}});if(!n.ok){let e=await n.text(),t=`GitHub API ${n.status}`;try{let n=JSON.parse(e);n.message&&(t=n.message)}catch{e&&(t=e)}throw Error(t)}if(n.status!==204)return await n.json()}};function te(e){let t=e.split(`.`);return t.length>1?t.at(-1).toLowerCase():`jpg`}async function ne(e){let t=await e.arrayBuffer(),n=new Uint8Array(t),r=``;for(let e of n)r+=String.fromCharCode(e);return btoa(r)}var g=null,_=null,v=100,y=200;function b(e,t=0){let n=new Date;return n.setHours(e,t,0,0),n.toISOString()}function x(){return[{id:1,number:101,name:`Анна Смирнова`,notes:`Предпочитает утренние занятия.`,meta:{course:`Английский B2`,paymentStatus:`paid`,paymentAmount:15e3,photoUrl:``},state:`open`},{id:2,number:102,name:`Илья Козлов`,notes:``,meta:{course:`Математика (ЕГЭ)`,paymentStatus:`partial`,paymentAmount:8e3,photoUrl:``},state:`open`}]}function S(){let e=b(10,0),t=b(11,0),n=b(10,30),r=b(11,30);return[{id:1,number:201,title:`Занятие: Анна Смирнова`,notes:``,meta:{studentNumber:101,start:e,end:t},state:`open`},{id:2,number:202,title:`Занятие: Илья Козлов`,notes:`Перехлёст с Анной — демо`,meta:{studentNumber:102,start:n,end:r},state:`open`},{id:3,number:203,title:`Занятие: Анна Смирнова`,notes:``,meta:{studentNumber:101,start:b(14,0),end:b(15,0)},state:`open`}]}function C(){return g||=x(),g}function w(){return _||=S(),_}var T=class{async listStudents(){return await E(200),C().filter(e=>e.state===`open`)}async createStudent(e){await E(200);let t=++v,n={id:t,number:t,name:e.name,notes:e.notes,meta:e.meta,state:`open`};return C().push(n),n}async updateStudent(e){await E(200);let t=C(),n=t.findIndex(t=>t.number===e.number);if(n===-1)throw Error(`Ученик не найден`);let r={...t[n],name:e.name,notes:e.notes,meta:e.meta};return t[n]=r,r}async deleteStudent(e){await E(200);let t=C(),n=t.findIndex(t=>t.number===e);if(n===-1)throw Error(`Ученик не найден`);t[n]={...t[n],state:`closed`}}async uploadStudentPhoto(e,t){await E(150);let n=await D(t),r=C().find(t=>t.number===e);return r&&(r.meta={...r.meta,photoUrl:n}),n}async listLessons(){return await E(200),w().filter(e=>e.state===`open`)}async createLesson(e){await E(200);let t=++y,n={id:t,number:t,title:e.title,notes:e.notes,meta:e.meta,state:`open`};return w().push(n),n}async updateLesson(e){await E(200);let t=w(),n=t.findIndex(t=>t.number===e.number);if(n===-1)throw Error(`Занятие не найдено`);let r={...t[n],title:e.title,notes:e.notes,meta:e.meta};return t[n]=r,r}async deleteLesson(e){await E(200);let t=w(),n=t.findIndex(t=>t.number===e);if(n===-1)throw Error(`Занятие не найдено`);t[n]={...t[n],state:`closed`}}};function E(e){return new Promise(t=>setTimeout(t,e))}function D(e){return new Promise((t,n)=>{let r=new FileReader;r.onload=()=>t(String(r.result)),r.onerror=()=>n(r.error),r.readAsDataURL(e)})}function O(e){return e.demoMode||!e.token||!e.owner||!e.repo?new T:new ee(e.owner,e.repo,e.token,e.assetsOwner,e.assetsRepo)}function k(e,t,n,r){return e<r&&n<t}function A(e,t){return k(new Date(e.start),new Date(e.end),new Date(t.start),new Date(t.end))}function j(e,t,n){for(let r of t)if(r.state===`open`&&!(n&&r.number===n)&&A(e,r.meta))return r;return null}function re(e){let t=e.filter(e=>e.state===`open`),n=[];for(let e=0;e<t.length;e++)for(let r=e+1;r<t.length;r++)A(t[e].meta,t[r].meta)&&n.push({a:t[e].number,b:t[r].number});return n}function M(e){let t=new Set;for(let n of re(e))t.add(n.a),t.add(n.b);return t}var ie=15,ae=6e4,N=new Set;function P(e,t){if(!(`Notification`in window))return()=>void 0;let n=()=>{if(document.hidden||Notification.permission!==`granted`)return;let n=Date.now(),r=ie*6e4;for(let i of e()){if(i.state!==`open`||N.has(i.number))continue;let e=new Date(i.meta.start).getTime()-n;if(e>0&&e<=r){let e=t().find(e=>e.number===i.meta.studentNumber);new Notification(`Скоро занятие`,{body:`${e?.name??`Ученик`} — ${I(i.meta.start)}`,tag:`lesson-${i.number}`}),N.add(i.number)}}},r=window.setInterval(n,ae);return n(),()=>window.clearInterval(r)}async function F(){return`Notification`in window?Notification.permission===`granted`||Notification.permission!==`denied`&&await Notification.requestPermission()===`granted`:!1}function I(e){return new Date(e).toLocaleTimeString(`ru-RU`,{hour:`2-digit`,minute:`2-digit`})}var L=`planning-calendar-config-v1`,R=`ivano82ff-eng`,z=`hello-bot`,B={owner:``,repo:``,token:``,demoMode:!0,assetsOwner:R,assetsRepo:z};function V(){try{let e=localStorage.getItem(L);if(!e)return{...B};let t=JSON.parse(e);return{owner:t.owner??``,repo:t.repo??``,token:t.token??``,demoMode:t.demoMode??!t.token,assetsOwner:t.assetsOwner??R,assetsRepo:t.assetsRepo??z}}catch{return{...B}}}function H(e){localStorage.setItem(L,JSON.stringify(e))}var U=`planning-theme-v1`;function W(){try{let e=localStorage.getItem(U);if(e===`light`||e===`dark`)return e}catch{}return`dark`}function G(e){localStorage.setItem(U,e)}function K(e){document.documentElement.dataset.theme=e}var q=[`Пн`,`Вт`,`Ср`,`Чт`,`Пт`,`Сб`,`Вс`],oe=[`Январь`,`Февраль`,`Март`,`Апрель`,`Май`,`Июнь`,`Июль`,`Август`,`Сентябрь`,`Октябрь`,`Ноябрь`,`Декабрь`],se={paid:`Оплачено`,partial:`Частично`,unpaid:`Не оплачено`},ce=8,le=60,ue=class{root;config;theme;students=[];lessons=[];tab=`schedule`;viewMonth;selectedDay;editingStudent=null;editingLesson=null;modal=null;overlapMessage=null;pendingPhoto=null;photoPreviewUrl=null;pendingLessonStart=null;pendingLessonEnd=null;loading=!1;error=null;stopReminders=null;modalHost;toastHost;escapeHandler=null;constructor(e){this.root=e;let t=document.getElementById(`planning-modal-host`),n=document.getElementById(`sync-toast-host`);if(!t||!n)throw Error(`Не найдены контейнеры модального окна или уведомлений`);this.modalHost=t,this.toastHost=n;let r=new Date;this.config=V(),this.theme=W(),this.viewMonth=new Date(r.getFullYear(),r.getMonth(),1),this.selectedDay=l(r),this.render(),this.refreshAll()}async refreshAll(e=!0){let t=this.students.length===0&&this.lessons.length===0;e&&t&&(this.loading=!0,this.error=null,this.render());try{let e=O(this.config),[t,n]=await Promise.all([e.listStudents(),e.listLessons()]);this.students=t,this.lessons=n,this.startRemindersIfNeeded(),this.error=null}catch(n){let r=n instanceof Error?n.message:String(n);e&&t?this.error=r:this.showSyncToast(r)}finally{this.loading=!1,this.render()}}startRemindersIfNeeded(){this.stopReminders?.(),this.stopReminders=P(()=>this.lessons,()=>this.students)}studentByNumber(e){return this.students.find(t=>t.number===e)}lessonsForDay(e){return this.lessons.filter(t=>t.state===`open`&&d(t.meta,e))}render(){let e=M(this.lessons);this.root.innerHTML=`
      <div class="layout">
        <header class="header">
          <div>
            <p class="header__kicker">Планинг</p>
            <h1 class="header__title">Учёт учеников и расписание</h1>
          </div>
          <div class="header__actions">
            <button class="btn btn--ghost" type="button" data-action="toggle-theme" title="День / ночь">
              ${this.theme===`dark`?`☀️ День`:`🌙 Ночь`}
            </button>
            <button class="btn btn--ghost" type="button" data-action="open-settings">Настройки</button>
            <button class="btn btn--ghost" type="button" data-action="notify-permission">Напоминания</button>
            <button class="btn" type="button" data-action="refresh" ${this.loading?`disabled`:``}>
              ${this.loading?`Загрузка…`:`Обновить`}
            </button>
          </div>
        </header>

        ${this.error?`<div class="banner banner--error" role="alert">${Z(this.error)}</div>`:``}
        ${this.config.demoMode?`<div class="banner banner--info">Демо-режим: данные локальные, GitHub не вызывается.</div>`:``}
        ${e.size?`<div class="banner banner--warn" role="alert">⚠ Перехлёст занятий: ${e.size} занятий пересекаются по времени.</div>`:``}

        <nav class="tabs" aria-label="Разделы">
          <button class="tab${this.tab===`students`?` tab--active`:``}" type="button" data-action="tab" data-tab="students">Ученики</button>
          <button class="tab${this.tab===`schedule`?` tab--active`:``}" type="button" data-action="tab" data-tab="schedule">Расписание</button>
        </nav>

        <main>${this.tab===`students`?this.renderStudents():this.renderSchedule(e)}</main>
      </div>
    `,this.bindEvents(),this.renderModalOverlay()}renderStudents(){return this.students.length?`
      <section class="students-toolbar">
        <button class="btn" type="button" data-action="new-student">+ Добавить ученика</button>
      </section>
      <section class="student-grid">
        ${this.students.map(e=>`
            <article class="student-card" data-action="edit-student" data-number="${e.number}" role="button" tabindex="0">
              <div class="student-card__photo">
                ${e.meta.photoUrl?`<img src="${Q(e.meta.photoUrl)}" alt="" />`:`<span class="student-card__placeholder">👤</span>`}
              </div>
              <div class="student-card__body">
                <h2>${Z(e.name)}</h2>
                <p class="student-card__course">${Z(e.meta.course)}</p>
                <p class="student-card__payment payment--${e.meta.paymentStatus}">
                  ${se[e.meta.paymentStatus]} · ${fe(e.meta.paymentAmount)}
                </p>
                <span class="student-card__edit-hint">Нажмите, чтобы изменить</span>
              </div>
            </article>
          `).join(``)}
      </section>
    `:`
        <section class="panel empty-panel">
          <p>Учеников пока нет.</p>
          <button class="btn" type="button" data-action="new-student">+ Добавить ученика</button>
        </section>
      `}renderSchedule(e){let t=this.lessonsForDay(this.selectedDay);return`
      <div class="schedule-grid">
        <section class="panel calendar-panel" aria-label="Календарь месяца">
          <div class="calendar-nav">
            <button class="btn btn--ghost" type="button" data-action="prev-month">‹</button>
            <h2 class="calendar-nav__title">${oe[this.viewMonth.getMonth()]} ${this.viewMonth.getFullYear()}</h2>
            <button class="btn btn--ghost" type="button" data-action="next-month">›</button>
          </div>
          <div class="weekdays">${q.map(e=>`<span>${e}</span>`).join(``)}</div>
          <div class="month-grid">${this.renderMonthCells()}</div>
        </section>

        <section class="panel day-panel" aria-label="Сетка дня">
          <div class="day-panel__header">
            <h2>${de(this.selectedDay)}</h2>
            <p class="hint day-panel__hint">Кликните по свободному времени → выберите ученика</p>
          </div>
          <div class="time-grid">
            <div class="time-grid__labels">
              ${Array.from({length:14},(e,t)=>{let n=ce+t;return`<span>${String(n).padStart(2,`0`)}:00</span>`}).join(``)}
            </div>
            <div class="time-grid__canvas" data-action="pick-slot">
              ${this.renderSlotGuides()}
              ${this.renderLessonBlocks(e,t)}
            </div>
          </div>
        </section>
      </div>
    `}renderSlotGuides(){return Array.from({length:14},(e,t)=>`<div class="time-slot-guide" style="top:${t/14*100}%;height:${1/14*100}%"></div>`).join(``)}renderMonthCells(){let e=this.viewMonth.getFullYear(),t=this.viewMonth.getMonth(),n=(new Date(e,t,1).getDay()+6)%7,r=new Date(e,t+1,0).getDate(),i=l(new Date),a=[];for(let e=0;e<n;e++)a.push(`<div class="day-cell day-cell--empty"></div>`);for(let n=1;n<=r;n++){let r=new Date(e,t,n),o=this.lessonsForDay(r).length,s=M(this.lessonsForDay(r)).size>0;a.push(`
        <button
          class="day-cell${J(r,this.selectedDay)?` day-cell--selected`:``}${J(r,i)?` day-cell--today`:``}${s?` day-cell--overlap`:``}"
          type="button"
          data-action="select-day"
          data-day="${r.toISOString()}"
        >
          <span class="day-cell__number">${n}</span>
          ${o?`<span class="day-cell__dots">${`•`.repeat(Math.min(o,3))}</span>`:``}
        </button>
      `)}return a.join(``)}renderLessonBlocks(e,t){return t.length?t.map(t=>{let n=this.studentByNumber(t.meta.studentNumber),r=new Date(t.meta.start),i=new Date(t.meta.end),a=r.getHours()*60+r.getMinutes(),o=i.getHours()*60+i.getMinutes(),s=(a-480)/840*100,c=Math.max((o-a)/840*100,4),l=e.has(t.number);return`
          <button
            class="lesson-block${l?` lesson-block--overlap`:``}"
            type="button"
            data-action="edit-lesson"
            data-number="${t.number}"
            style="top:${s}%;height:${c}%"
          >
            <strong>${Z(n?.name??`Ученик`)}</strong>
            <span>${Y(t.meta.start,t.meta.end)}</span>
            ${l?`<span class="lesson-block__warn">⚠ перехлёст</span>`:``}
          </button>
        `}).join(``):``}currentPhotoPreview(){return this.photoPreviewUrl?this.photoPreviewUrl:this.editingStudent?.meta.photoUrl??null}renderModalContent(){if(!this.modal)return``;if(this.modal===`overlap`)return`
        <div class="modal modal--danger">
          <div class="modal__body">
            <h2>Перехлёст занятий</h2>
            <p>${Z(this.overlapMessage??`Два занятия пересекаются по времени.`)}</p>
            <div class="modal__actions">
              <button class="btn" type="button" data-action="close-modal">Понятно</button>
            </div>
          </div>
        </div>
      `;if(this.modal===`settings`)return`
        <div class="modal">
          <form class="modal__form" data-form="settings">
            <h2>Настройки GitHub</h2>
            <label>Owner (данные)<input name="owner" value="${Q(this.config.owner)}" required /></label>
            <label>Repo (данные)<input name="repo" value="${Q(this.config.repo)}" required /></label>
            <label>PAT<input name="token" type="password" value="${Q(this.config.token)}" autocomplete="off" /></label>
            <label class="checkbox"><input name="demoMode" type="checkbox" ${this.config.demoMode?`checked`:``} /> Демо-режим</label>
            <p class="hint">Фото хранятся в публичном ${this.config.assetsOwner}/${this.config.assetsRepo}. PAT — только в браузере.</p>
            <div class="modal__actions">
              <button class="btn btn--ghost" type="button" data-action="close-modal">Отмена</button>
              <button class="btn" type="submit">Сохранить</button>
            </div>
          </form>
        </div>
      `;if(this.modal===`student`){let e=this.editingStudent,t=this.currentPhotoPreview();return`
        <div class="modal">
          <form class="modal__form" data-form="student">
            <h2>${e?`Изменить ученика`:`Новый ученик`}</h2>
            <div class="photo-picker">
              <button class="photo-picker__btn" type="button" data-action="pick-photo">
                ${t?`<img src="${Q(t)}" alt="" class="photo-picker__img" />`:`<span class="photo-picker__placeholder">👤</span>`}
                <span class="photo-picker__label">${t?`Заменить фото`:`Добавить фото`}</span>
              </button>
              <input class="photo-picker__input" name="photo" type="file" accept="image/*" hidden />
            </div>
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
            <label>Заметки<textarea name="notes" rows="3">${Z(e?.notes??``)}</textarea></label>
            <div class="modal__actions">
              <button class="btn btn--ghost" type="button" data-action="close-modal">Отмена</button>
              <button class="btn" type="submit">${e?`Сохранить`:`Создать`}</button>
            </div>
          </form>
        </div>
      `}let e=this.editingLesson,t=e?.meta.studentNumber??this.students[0]?.number??0,n=e?f(e.meta.start):this.pendingLessonStart?X(this.pendingLessonStart):pe(this.selectedDay),r=e?f(e.meta.end):this.pendingLessonEnd?X(this.pendingLessonEnd):me(this.selectedDay);return`
      <div class="modal">
        <form class="modal__form" data-form="lesson">
          <h2>${e?`Изменить занятие`:`Новое занятие`}</h2>
          <p class="hint">Расписание отдельно от карточки ученика</p>
          <label>Ученик
            <select name="studentNumber" required>
              ${this.students.map(e=>`<option value="${e.number}" ${e.number===t?`selected`:``}>${Z(e.name)}</option>`).join(``)}
            </select>
          </label>
          <label>Начало<input name="start" type="datetime-local" value="${Q(n)}" required /></label>
          <label>Конец<input name="end" type="datetime-local" value="${Q(r)}" required /></label>
          <label>Заметки<textarea name="notes" rows="3">${Z(e?.notes??``)}</textarea></label>
          <div class="modal__actions">
            ${e?`<button class="btn btn--danger" type="button" data-action="delete-lesson">Удалить</button>`:``}
            <button class="btn btn--ghost" type="button" data-action="close-modal">Отмена</button>
            <button class="btn" type="submit">${e?`Сохранить`:`Создать`}</button>
          </div>
        </form>
      </div>
    `}renderModalOverlay(){if(!this.modal){this.modalHost.innerHTML=``,document.body.classList.remove(`modal-open`),this.detachEscapeHandler();return}this.modalHost.innerHTML=`
      <div class="modal-overlay" data-action="overlay-backdrop" role="dialog" aria-modal="true">
        ${this.renderModalContent()}
      </div>
    `,document.body.classList.add(`modal-open`),this.attachEscapeHandler(),this.bindModalEvents()}attachEscapeHandler(){this.detachEscapeHandler(),this.escapeHandler=e=>{e.key===`Escape`&&this.modal&&(this.modal===`overlap`?(this.modal=`lesson`,this.overlapMessage=null):this.closeModal(),this.render())},document.addEventListener(`keydown`,this.escapeHandler)}detachEscapeHandler(){this.escapeHandler&&=(document.removeEventListener(`keydown`,this.escapeHandler),null)}snapshotData(){return{students:this.students.map(e=>({...e,meta:{...e.meta}})),lessons:this.lessons.map(e=>({...e,meta:{...e.meta}}))}}restoreSnapshot(e){this.students=e.students,this.lessons=e.lessons,this.render()}showSyncToast(e){this.toastHost.innerHTML=`<div class="sync-toast" role="alert">${Z(e)}</div>`,window.setTimeout(()=>{this.toastHost.innerHTML=``},6e3)}syncInBackground(e,t,n){e.catch(e=>{t(),this.showSyncToast(e instanceof Error?e.message:n)})}createTempStudent(e,t){let n=-Date.now();return{id:n,number:n,name:e.name,notes:e.notes,meta:{...e.meta,photoUrl:t??e.meta.photoUrl},state:`open`}}createTempLesson(e){let t=-Date.now();return{id:t,number:t,title:e.title,notes:e.notes,meta:{...e.meta},state:`open`}}bindEvents(){this.root.querySelector(`[data-action="toggle-theme"]`)?.addEventListener(`click`,()=>{this.theme=this.theme===`dark`?`light`:`dark`,G(this.theme),K(this.theme),this.render()}),this.root.querySelector(`[data-action="refresh"]`)?.addEventListener(`click`,()=>void this.refreshAll(!0)),this.root.querySelector(`[data-action="open-settings"]`)?.addEventListener(`click`,()=>{this.modal=`settings`,this.renderModalOverlay()}),this.root.querySelector(`[data-action="notify-permission"]`)?.addEventListener(`click`,()=>{F().then(e=>{this.error=e?null:`Разрешите уведомления в браузере.`,this.render()})}),this.root.querySelectorAll(`[data-action="tab"]`).forEach(e=>{e.addEventListener(`click`,()=>{this.tab=e.dataset.tab,this.render()})}),this.root.querySelector(`[data-action="new-student"]`)?.addEventListener(`click`,()=>{this.editingStudent=null,this.clearPhotoPreview(),this.modal=`student`,this.render()}),this.root.querySelectorAll(`[data-action="edit-student"]`).forEach(e=>{e.addEventListener(`click`,()=>this.openStudentEdit(Number(e.dataset.number))),e.addEventListener(`keydown`,t=>{let n=t;(n.key===`Enter`||n.key===` `)&&(n.preventDefault(),this.openStudentEdit(Number(e.dataset.number)))})}),this.root.querySelector(`[data-action="pick-slot"]`)?.addEventListener(`click`,e=>{if(!e.target.closest(`.lesson-block`)){if(!this.students.length){this.error=`Сначала добавьте ученика.`,this.render();return}this.openLessonAtClick(e)}}),this.root.querySelectorAll(`[data-action="edit-lesson"]`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation();let n=Number(e.dataset.number);this.editingLesson=this.lessons.find(e=>e.number===n)??null,this.modal=`lesson`,this.render()})}),this.root.querySelector(`[data-action="prev-month"]`)?.addEventListener(`click`,()=>{this.viewMonth=new Date(this.viewMonth.getFullYear(),this.viewMonth.getMonth()-1,1),this.render()}),this.root.querySelector(`[data-action="next-month"]`)?.addEventListener(`click`,()=>{this.viewMonth=new Date(this.viewMonth.getFullYear(),this.viewMonth.getMonth()+1,1),this.render()}),this.root.querySelectorAll(`[data-action="select-day"]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.day;t&&(this.selectedDay=l(new Date(t)),this.render())})})}bindModalEvents(){let e=this.modalHost.querySelector(`[data-action="overlay-backdrop"]`);e?.addEventListener(`click`,t=>{t.target===e&&this.modal!==`overlap`&&(this.closeModal(),this.render())}),this.modalHost.querySelector(`[data-action="close-modal"]`)?.addEventListener(`click`,()=>{if(this.modal===`overlap`){this.modal=`lesson`,this.overlapMessage=null,this.renderModalOverlay();return}this.closeModal(),this.render()});let t=this.modalHost.querySelector(`form[data-form="settings"]`);t?.addEventListener(`submit`,e=>{e.preventDefault();let n=new FormData(t);this.config={owner:String(n.get(`owner`)??``).trim(),repo:String(n.get(`repo`)??``).trim(),token:String(n.get(`token`)??``).trim(),demoMode:n.get(`demoMode`)===`on`,assetsOwner:this.config.assetsOwner,assetsRepo:this.config.assetsRepo},H(this.config),this.closeModal(),this.refreshAll(!0)});let n=this.modalHost.querySelector(`form[data-form="student"]`);n?.addEventListener(`submit`,e=>{e.preventDefault(),this.submitStudentForm(n)}),n?.querySelector(`[data-action="pick-photo"]`)?.addEventListener(`click`,()=>{n.querySelector(`.photo-picker__input`)?.click()}),n?.querySelector(`.photo-picker__input`)?.addEventListener(`change`,e=>{let t=e.target.files?.[0];t&&(this.pendingPhoto=t,this.revokePhotoPreview(),this.photoPreviewUrl=URL.createObjectURL(t),this.renderModalOverlay())});let r=this.modalHost.querySelector(`form[data-form="lesson"]`);r?.addEventListener(`submit`,e=>{e.preventDefault(),this.submitLessonForm(r)}),this.modalHost.querySelector(`[data-action="delete-lesson"]`)?.addEventListener(`click`,()=>{this.editingLesson&&this.deleteLesson(this.editingLesson.number)})}openStudentEdit(e){this.editingStudent=this.students.find(t=>t.number===e)??null,this.clearPhotoPreview(),this.modal=`student`,this.render()}openLessonAtClick(e){let t=e.currentTarget.getBoundingClientRect(),n=480+(e.clientY-t.top)/t.height*840,r=Math.floor(n/60),i=Math.floor(n%60/15)*15,a=new Date(this.selectedDay);a.setHours(r,i,0,0);let o=new Date(a);o.setMinutes(o.getMinutes()+le),this.editingLesson=null,this.modal=`lesson`,this.pendingLessonStart=a,this.pendingLessonEnd=o,this.render()}closeModal(){this.modal=null,this.editingStudent=null,this.editingLesson=null,this.pendingPhoto=null,this.pendingLessonStart=null,this.pendingLessonEnd=null,this.overlapMessage=null,this.clearPhotoPreview(),this.modalHost.innerHTML=``,document.body.classList.remove(`modal-open`),this.detachEscapeHandler()}clearPhotoPreview(){this.revokePhotoPreview(),this.photoPreviewUrl=null}revokePhotoPreview(){this.photoPreviewUrl?.startsWith(`blob:`)&&URL.revokeObjectURL(this.photoPreviewUrl)}submitStudentForm(e){let t=new FormData(e),n={name:String(t.get(`name`)??``).trim(),notes:String(t.get(`notes`)??``).trim(),meta:{course:String(t.get(`course`)??``).trim(),paymentStatus:String(t.get(`paymentStatus`)??`unpaid`),paymentAmount:Number(t.get(`paymentAmount`)??0),photoUrl:this.editingStudent?.meta.photoUrl}},r=this.pendingPhoto,i=r?URL.createObjectURL(r):void 0,a=this.editingStudent,o=this.snapshotData();if(this.closeModal(),this.render(),a){let e=this.students.findIndex(e=>e.number===a.number);e>=0&&(this.students[e]={...a,name:n.name,notes:n.notes,meta:{...n.meta,photoUrl:i??n.meta.photoUrl}}),this.render(),this.syncInBackground((async()=>{let e=O(this.config),t=await e.updateStudent({...n,number:a.number});if(r){let i=await e.uploadStudentPhoto(t.number,r);t=await e.updateStudent({...n,number:t.number,meta:{...n.meta,photoUrl:i}})}let i=this.students.findIndex(e=>e.number===a.number);i>=0&&(this.students[i]=t),this.render()})(),()=>this.restoreSnapshot(o),`Не удалось сохранить ученика`);return}let s=this.createTempStudent(n,i);this.students.push(s),this.render(),this.syncInBackground((async()=>{let e=O(this.config),t=await e.createStudent(n);if(r){let i=await e.uploadStudentPhoto(t.number,r);t=await e.updateStudent({...n,number:t.number,meta:{...n.meta,photoUrl:i}})}let i=this.students.findIndex(e=>e.number===s.number);i>=0&&(this.students[i]=t),this.render()})(),()=>this.restoreSnapshot(o),`Не удалось создать ученика`)}submitLessonForm(e){let t=new FormData(e),n=Number(t.get(`studentNumber`)),r=this.studentByNumber(n),i={studentNumber:n,start:p(String(t.get(`start`))),end:p(String(t.get(`end`)))},a=j(i,this.lessons,this.editingLesson?.number);if(a){let e=this.studentByNumber(a.meta.studentNumber);this.overlapMessage=`Пересечение с «${e?.name??`учеником`}» (${Y(a.meta.start,a.meta.end)}).`,this.modal=`overlap`,this.renderModalOverlay();return}let o={title:`Занятие: ${r?.name??`Ученик`}`,notes:String(t.get(`notes`)??``).trim(),meta:i},s=this.editingLesson,c=this.snapshotData();if(this.closeModal(),this.render(),s){let e=this.lessons.findIndex(e=>e.number===s.number);e>=0&&(this.lessons[e]={...s,title:o.title,notes:o.notes,meta:o.meta}),this.render(),this.syncInBackground((async()=>{let e=await O(this.config).updateLesson({...o,number:s.number}),t=this.lessons.findIndex(e=>e.number===s.number);t>=0&&(this.lessons[t]=e),this.render()})(),()=>this.restoreSnapshot(c),`Не удалось сохранить занятие`);return}let l=this.createTempLesson(o);this.lessons.push(l),this.render(),this.syncInBackground((async()=>{let e=await O(this.config).createLesson(o),t=this.lessons.findIndex(e=>e.number===l.number);t>=0&&(this.lessons[t]=e),this.render()})(),()=>this.restoreSnapshot(c),`Не удалось создать занятие`)}deleteLesson(e){if(!confirm(`Отменить занятие (issue будет закрыт)?`))return;let t=this.snapshotData();this.closeModal(),this.lessons=this.lessons.filter(t=>t.number!==e),this.render(),this.syncInBackground(O(this.config).deleteLesson(e).then(()=>void 0),()=>this.restoreSnapshot(t),`Не удалось удалить занятие`)}};function J(e,t){return e.getFullYear()===t.getFullYear()&&e.getMonth()===t.getMonth()&&e.getDate()===t.getDate()}function de(e){return e.toLocaleDateString(`ru-RU`,{weekday:`long`,day:`numeric`,month:`long`,year:`numeric`})}function Y(e,t){let n={hour:`2-digit`,minute:`2-digit`};return`${new Date(e).toLocaleTimeString(`ru-RU`,n)} – ${new Date(t).toLocaleTimeString(`ru-RU`,n)}`}function fe(e){return new Intl.NumberFormat(`ru-RU`).format(e)+` ₽`}function pe(e){let t=new Date(e);return t.setHours(10,0,0,0),X(t)}function me(e){let t=new Date(e);return t.setHours(11,0,0,0),X(t)}function X(e){let t=e.getTimezoneOffset()*6e4;return new Date(e.getTime()-t).toISOString().slice(0,16)}function Z(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`)}function Q(e){return Z(e).replaceAll(`'`,`&#39;`)}K(W());var $=document.getElementById(`app`);if(!$)throw Error(`Не найден корневой элемент #app`);new ue($);