import"./modulepreload-polyfill-P2Xu9kJm.js";var e=/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?([\s\S]*)$/;function t(e){let t={};for(let n of e.split(/\r?\n/)){let e=n.trim();if(!e||e.startsWith(`#`))continue;let r=e.match(/^([A-Za-z_][\w-]*)\s*:\s*(.+)$/);if(!r)continue;let[,i,a]=r,o=a.trim();t[i]=o===`true`?!0:o===`false`?!1:/^-?\d+(\.\d+)?$/.test(o)?Number(o):o.replace(/^['"]|['"]$/g,``)}return t}function n(e){try{return JSON.parse(e)}catch{return null}}function r(r){let i=(r??``).trim();if(!i)return{fields:{},notes:``};let a=i.match(e);if(!a)return{fields:{},notes:i};let[,o,s]=a,c=t(o);if(Object.keys(c).length)return{fields:c,notes:s.trim()};let l=n(o),u={};if(l)for(let[e,t]of Object.entries(l))(typeof t==`string`||typeof t==`number`||typeof t==`boolean`)&&(u[e]=t);return{fields:u,notes:s.trim()}}function i(e,t){let n=[`---`];for(let[t,r]of Object.entries(e))r!==void 0&&n.push(`${t}: ${r}`);return n.push(`---`),t.trim()&&n.push(``,t.trim()),n.join(`
`)}function a(e){let{fields:t,notes:n}=r(e);if(!t.course)return{meta:null,notes:n};let i=String(t.paymentStatus??`unpaid`);return{meta:{course:String(t.course),paymentStatus:i===`paid`||i===`partial`?i:`unpaid`,paymentAmount:Number(t.paymentAmount??0),lessonPrice:Number(t.lessonPrice??0),parentPhone1:t.parentPhone1?String(t.parentPhone1):void 0,parentPhone2:t.parentPhone2?String(t.parentPhone2):void 0,maxUrl:t.maxUrl?String(t.maxUrl):void 0,telegramUrl:t.telegramUrl?String(t.telegramUrl):void 0,photoUrl:t.photoUrl?String(t.photoUrl):void 0},notes:n}}function o(e,t){return i({course:e.course,paymentStatus:e.paymentStatus,paymentAmount:e.paymentAmount,lessonPrice:e.lessonPrice,parentPhone1:e.parentPhone1,parentPhone2:e.parentPhone2,maxUrl:e.maxUrl,telegramUrl:e.telegramUrl,photoUrl:e.photoUrl},t)}function s(e){let{fields:t,notes:n}=r(e);if(!t.start||!t.end||!t.studentNumber)return{meta:null,notes:n};let i=t.completed===!0||t.completed===`true`?!0:t.completed===!1||t.completed===`false`?!1:void 0;return{meta:{studentNumber:Number(t.studentNumber),start:String(t.start),end:String(t.end),completed:i},notes:n}}function c(e,t){let n={studentNumber:e.studentNumber,start:e.start,end:e.end};return e.completed!==void 0&&(n.completed=e.completed),i(n,t)}function l(e){let t=new Date(e);return t.setHours(0,0,0,0),t}function u(e){let t=new Date(e);return t.setHours(23,59,59,999),t}function ee(e,t){let n=l(t),r=u(t),i=new Date(e.start),a=new Date(e.end);return i<=r&&a>=n}function d(e){let t=new Date(e),n=t.getTimezoneOffset()*6e4;return new Date(t.getTime()-n).toISOString().slice(0,16)}function f(e){return new Date(e).toISOString()}var p=`student`,m=`lesson`,te=class{owner;repo;token;assetsOwner;assetsRepo;defaultBranch=null;constructor(e,t,n,r,i){this.owner=e,this.repo=t,this.token=n,this.assetsOwner=r,this.assetsRepo=i}async listStudents(){return(await this.listIssues(p)).map(e=>this.toStudent(e)).filter(e=>e.meta!==null)}async createStudent(e){let t=await this.request(`/repos/${this.owner}/${this.repo}/issues`,{method:`POST`,body:JSON.stringify({title:e.name,body:o(e.meta,e.notes),labels:[p]})}),n=this.toStudent(t);if(!n.meta)throw Error(`Не удалось разобрать карточку ученика`);return n}async updateStudent(e){let t=await this.request(`/repos/${this.owner}/${this.repo}/issues/${e.number}`,{method:`PATCH`,body:JSON.stringify({title:e.name,body:o(e.meta,e.notes)})}),n=this.toStudent(t);if(!n.meta)throw Error(`Не удалось разобрать карточку ученика`);return n}async deleteStudent(e){await this.closeIssue(e)}async uploadStudentPhoto(e,t){let n=await this.getDefaultBranch(this.assetsOwner,this.assetsRepo),r=`students/${e}-${Date.now()}.${ne(t.name)}`,i=await re(t),a=await this.getFileSha(this.assetsOwner,this.assetsRepo,r);return await this.request(`/repos/${this.assetsOwner}/${this.assetsRepo}/contents/${r}`,{method:`PUT`,body:JSON.stringify({message:`Фото ученика #${e}`,content:i,branch:n,...a?{sha:a}:{}})}),`https://raw.githubusercontent.com/${this.assetsOwner}/${this.assetsRepo}/${n}/${r}`}async listLessons(){return(await this.listIssues(m)).map(e=>this.toLesson(e)).filter(e=>e.meta!==null)}async createLesson(e){let t=await this.request(`/repos/${this.owner}/${this.repo}/issues`,{method:`POST`,body:JSON.stringify({title:e.title,body:c(e.meta,e.notes),labels:[m]})}),n=this.toLesson(t);if(!n.meta)throw Error(`Не удалось разобрать занятие`);return n}async updateLesson(e){let t=await this.request(`/repos/${this.owner}/${this.repo}/issues/${e.number}`,{method:`PATCH`,body:JSON.stringify({title:e.title,body:c(e.meta,e.notes)})}),n=this.toLesson(t);if(!n.meta)throw Error(`Не удалось разобрать занятие`);return n}async deleteLesson(e){await this.closeIssue(e)}async listIssues(e){return(await this.request(`/repos/${this.owner}/${this.repo}/issues?state=all&per_page=100&labels=${e}`)).filter(e=>!e.labels.some(e=>e.name===`pull_request`))}async closeIssue(e){await this.request(`/repos/${this.owner}/${this.repo}/issues/${e}`,{method:`PATCH`,body:JSON.stringify({state:`closed`})})}async getDefaultBranch(e,t){if(e===this.assetsOwner&&t===this.assetsRepo&&this.defaultBranch)return this.defaultBranch;let n=await this.request(`/repos/${e}/${t}`);return e===this.assetsOwner&&t===this.assetsRepo&&(this.defaultBranch=n.default_branch),n.default_branch}async getFileSha(e,t,n){try{return(await this.request(`/repos/${e}/${t}/contents/${n}`)).sha}catch{return null}}toStudent(e){let{meta:t,notes:n}=a(e.body);return{id:e.id,number:e.number,name:e.title,notes:n,meta:t,state:e.state}}toLesson(e){let{meta:t,notes:n}=s(e.body);return{id:e.id,number:e.number,title:e.title,notes:n,meta:t,state:e.state}}async request(e,t){let n=await fetch(`https://api.github.com${e}`,{...t,headers:{Accept:`application/vnd.github+json`,Authorization:`Bearer ${this.token}`,"X-GitHub-Api-Version":`2022-11-28`,...t?.body?{"Content-Type":`application/json`}:{},...t?.headers}});if(!n.ok){let e=await n.text(),t=`GitHub API ${n.status}`;try{let n=JSON.parse(e);n.message&&(t=n.message)}catch{e&&(t=e)}throw Error(t)}if(n.status!==204)return await n.json()}};function ne(e){let t=e.split(`.`);return t.length>1?t.at(-1).toLowerCase():`jpg`}async function re(e){let t=await e.arrayBuffer(),n=new Uint8Array(t),r=``;for(let e of n)r+=String.fromCharCode(e);return btoa(r)}var h=null,g=null,ie=100,ae=200;function _(e,t=0){let n=new Date;return n.setHours(e,t,0,0),n.toISOString()}function oe(){return[{id:1,number:101,name:`Анна Смирнова`,notes:`Предпочитает утренние занятия.`,meta:{course:`Английский B2`,paymentStatus:`partial`,paymentAmount:15e3,lessonPrice:2500,parentPhone1:`+7 900 111-22-33`,parentPhone2:`+7 900 444-55-66`,telegramUrl:`https://t.me/example`,photoUrl:``},state:`open`},{id:2,number:102,name:`Илья Козлов`,notes:``,meta:{course:`Математика (ЕГЭ)`,paymentStatus:`unpaid`,paymentAmount:8e3,lessonPrice:3e3,parentPhone1:`+7 901 777-88-99`,maxUrl:`https://max.ru/u/example`,photoUrl:``},state:`open`}]}function se(){let e=_(10,0),t=_(11,0),n=_(10,30),r=_(11,30);return[{id:1,number:201,title:`Занятие: Анна Смирнова`,notes:``,meta:{studentNumber:101,start:e,end:t,completed:!0},state:`open`},{id:2,number:202,title:`Занятие: Илья Козлов`,notes:`Перехлёст с Анной — демо`,meta:{studentNumber:102,start:n,end:r,completed:!1},state:`open`},{id:3,number:203,title:`Занятие: Анна Смирнова`,notes:``,meta:{studentNumber:101,start:_(14,0),end:_(15,0)},state:`open`}]}function v(){return h||=oe(),h}function y(){return g||=se(),g}var b=class{async listStudents(){return await x(200),v().filter(e=>e.state===`open`)}async createStudent(e){await x(200);let t=++ie,n={id:t,number:t,name:e.name,notes:e.notes,meta:e.meta,state:`open`};return v().push(n),n}async updateStudent(e){await x(200);let t=v(),n=t.findIndex(t=>t.number===e.number);if(n===-1)throw Error(`Ученик не найден`);let r={...t[n],name:e.name,notes:e.notes,meta:e.meta};return t[n]=r,r}async deleteStudent(e){await x(200);let t=v(),n=t.findIndex(t=>t.number===e);if(n===-1)throw Error(`Ученик не найден`);t[n]={...t[n],state:`closed`}}async uploadStudentPhoto(e,t){await x(150);let n=await ce(t),r=v().find(t=>t.number===e);return r&&(r.meta={...r.meta,photoUrl:n}),n}async listLessons(){return await x(200),y().filter(e=>e.state===`open`)}async createLesson(e){await x(200);let t=++ae,n={id:t,number:t,title:e.title,notes:e.notes,meta:e.meta,state:`open`};return y().push(n),n}async updateLesson(e){await x(200);let t=y(),n=t.findIndex(t=>t.number===e.number);if(n===-1)throw Error(`Занятие не найдено`);let r={...t[n],title:e.title,notes:e.notes,meta:e.meta};return t[n]=r,r}async deleteLesson(e){await x(200);let t=y(),n=t.findIndex(t=>t.number===e);if(n===-1)throw Error(`Занятие не найдено`);t[n]={...t[n],state:`closed`}}};function x(e){return new Promise(t=>setTimeout(t,e))}function ce(e){return new Promise((t,n)=>{let r=new FileReader;r.onload=()=>t(String(r.result)),r.onerror=()=>n(r.error),r.readAsDataURL(e)})}function S(e){return e.demoMode||!e.token||!e.owner||!e.repo?new b:new te(e.owner,e.repo,e.token,e.assetsOwner,e.assetsRepo)}function le(e,t,n,r){return e<r&&n<t}function C(e,t){return le(new Date(e.start),new Date(e.end),new Date(t.start),new Date(t.end))}function w(e,t,n){for(let r of t)if(r.state===`open`&&!(n&&r.number===n)&&C(e,r.meta))return r;return null}function T(e){let t=e.filter(e=>e.state===`open`),n=[];for(let e=0;e<t.length;e++)for(let r=e+1;r<t.length;r++)C(t[e].meta,t[r].meta)&&n.push({a:t[e].number,b:t[r].number});return n}function E(e){let t=new Set;for(let n of T(e))t.add(n.a),t.add(n.b);return t}function D(e){return new Date(e)<new Date}function O(e){return e.meta.completed===void 0?D(e.meta.end):e.meta.completed}function k(e,t){return t.filter(t=>t.state===`open`&&t.meta.studentNumber===e).sort((e,t)=>new Date(e.meta.start).getTime()-new Date(t.meta.start).getTime())}function A(e,t,n){let r=k(e.number,t),i=r.filter(e=>{let t=n?.get(e.number);return t===void 0?O(e):t}).length,a=e.meta.lessonPrice??0,o=i*a,s=e.meta.paymentAmount??0;return{totalLessons:r.length,completedLessons:i,lessonPrice:a,dueNow:o,paid:s,remainder:Math.max(0,o-s),overpayment:Math.max(0,s-o)}}function j(e){return e.dueNow===0?e.paid>0?`paid`:`unpaid`:e.remainder<=0?`paid`:e.paid>0?`partial`:`unpaid`}function ue(e){return e.replace(/[^\d+]/g,``)}var de=15,fe=6e4,M=new Set;function pe(e,t){if(!(`Notification`in window))return()=>void 0;let n=()=>{if(document.hidden||Notification.permission!==`granted`)return;let n=Date.now(),r=de*6e4;for(let i of e()){if(i.state!==`open`||M.has(i.number))continue;let e=new Date(i.meta.start).getTime()-n;if(e>0&&e<=r){let e=t().find(e=>e.number===i.meta.studentNumber);new Notification(`Скоро занятие`,{body:`${e?.name??`Ученик`} — ${P(i.meta.start)}`,tag:`lesson-${i.number}`}),M.add(i.number)}}},r=window.setInterval(n,fe);return n(),()=>window.clearInterval(r)}async function N(){return`Notification`in window?Notification.permission===`granted`||Notification.permission!==`denied`&&await Notification.requestPermission()===`granted`:!1}function P(e){return new Date(e).toLocaleTimeString(`ru-RU`,{hour:`2-digit`,minute:`2-digit`})}var F=`planning-calendar-config-v1`,I=`ivano82ff-eng`,L=`hello-bot`,R={owner:``,repo:``,token:``,demoMode:!0,assetsOwner:I,assetsRepo:L};function z(){try{let e=localStorage.getItem(F);if(!e)return{...R};let t=JSON.parse(e);return{owner:t.owner??``,repo:t.repo??``,token:t.token??``,demoMode:t.demoMode??!t.token,assetsOwner:t.assetsOwner??I,assetsRepo:t.assetsRepo??L}}catch{return{...R}}}function me(e){localStorage.setItem(F,JSON.stringify(e))}var B=`planning-theme-v1`;function V(){try{let e=localStorage.getItem(B);if(e===`light`||e===`dark`)return e}catch{}return`dark`}function he(e){localStorage.setItem(B,e)}function H(e){document.documentElement.dataset.theme=e}var ge=[`Пн`,`Вт`,`Ср`,`Чт`,`Пт`,`Сб`,`Вс`],_e=[`Январь`,`Февраль`,`Март`,`Апрель`,`Май`,`Июнь`,`Июль`,`Август`,`Сентябрь`,`Октябрь`,`Ноябрь`,`Декабрь`],ve={paid:`Оплачено`,partial:`Частично`,unpaid:`Не оплачено`},U=8,ye=60,be=class{root;config;theme;students=[];lessons=[];tab=`schedule`;viewMonth;selectedDay;editingStudent=null;editingLesson=null;modal=null;overlapMessage=null;pendingPhoto=null;photoPreviewUrl=null;pendingLessonStart=null;pendingLessonEnd=null;loading=!1;error=null;stopReminders=null;modalHost;toastHost;escapeHandler=null;modalLessonCompleted=new Map;constructor(e){this.root=e;let t=document.getElementById(`planning-modal-host`),n=document.getElementById(`sync-toast-host`);if(!t||!n)throw Error(`Не найдены контейнеры модального окна или уведомлений`);this.modalHost=t,this.toastHost=n;let r=new Date;this.config=z(),this.theme=V(),this.viewMonth=new Date(r.getFullYear(),r.getMonth(),1),this.selectedDay=l(r),this.render(),this.refreshAll()}async refreshAll(e=!0){let t=this.students.length===0&&this.lessons.length===0;e&&t&&(this.loading=!0,this.error=null,this.render());try{let e=S(this.config),[t,n]=await Promise.all([e.listStudents(),e.listLessons()]);this.students=t,this.lessons=n,this.startRemindersIfNeeded(),this.error=null}catch(n){let r=n instanceof Error?n.message:String(n);e&&t?this.error=r:this.showSyncToast(r)}finally{this.loading=!1,this.render()}}startRemindersIfNeeded(){this.stopReminders?.(),this.stopReminders=pe(()=>this.lessons,()=>this.students)}studentByNumber(e){return this.students.find(t=>t.number===e)}lessonsForDay(e){return this.lessons.filter(t=>t.state===`open`&&ee(t.meta,e))}render(){let e=E(this.lessons);this.root.innerHTML=`
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
                ${this.renderStudentCardPayment(e)}
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
            <h2 class="calendar-nav__title">${_e[this.viewMonth.getMonth()]} ${this.viewMonth.getFullYear()}</h2>
            <button class="btn btn--ghost" type="button" data-action="next-month">›</button>
          </div>
          <div class="weekdays">${ge.map(e=>`<span>${e}</span>`).join(``)}</div>
          <div class="month-grid">${this.renderMonthCells()}</div>
        </section>

        <section class="panel day-panel" aria-label="Сетка дня">
          <div class="day-panel__header">
            <h2>${xe(this.selectedDay)}</h2>
            <p class="hint day-panel__hint">Кликните по свободному времени → выберите ученика</p>
          </div>
          <div class="time-grid">
            <div class="time-grid__labels">
              ${Array.from({length:14},(e,t)=>{let n=U+t;return`<span>${String(n).padStart(2,`0`)}:00</span>`}).join(``)}
            </div>
            <div class="time-grid__canvas" data-action="pick-slot">
              ${this.renderSlotGuides()}
              ${this.renderLessonBlocks(e,t)}
            </div>
          </div>
        </section>
      </div>
    `}renderSlotGuides(){return Array.from({length:14},(e,t)=>`<div class="time-slot-guide" style="top:${t/14*100}%;height:${1/14*100}%"></div>`).join(``)}renderMonthCells(){let e=this.viewMonth.getFullYear(),t=this.viewMonth.getMonth(),n=(new Date(e,t,1).getDay()+6)%7,r=new Date(e,t+1,0).getDate(),i=l(new Date),a=[];for(let e=0;e<n;e++)a.push(`<div class="day-cell day-cell--empty"></div>`);for(let n=1;n<=r;n++){let r=new Date(e,t,n),o=this.lessonsForDay(r).length,s=E(this.lessonsForDay(r)).size>0;a.push(`
        <button
          class="day-cell${W(r,this.selectedDay)?` day-cell--selected`:``}${W(r,i)?` day-cell--today`:``}${s?` day-cell--overlap`:``}"
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
            <span>${G(t.meta.start,t.meta.end)}</span>
            ${l?`<span class="lesson-block__warn">⚠ перехлёст</span>`:``}
          </button>
        `}).join(``):``}currentPhotoPreview(){return this.photoPreviewUrl?this.photoPreviewUrl:this.editingStudent?.meta.photoUrl??null}initModalLessonCompleted(e){this.modalLessonCompleted.clear();for(let t of k(e,this.lessons))this.modalLessonCompleted.set(t.number,O(t))}renderStudentCardPayment(e){let t=A(e,this.lessons),n=j(t),r=t.overpayment>0?`переплата ${K(t.overpayment)}`:t.remainder>0?`остаток ${K(t.remainder)}`:K(t.paid);return`<p class="student-card__payment payment--${n}">${ve[n]} · ${r}</p>`}renderStudentModal(){let e=this.editingStudent,t=this.currentPhotoPreview(),n=A(e??{id:0,number:0,name:``,notes:``,meta:{course:``,paymentStatus:`unpaid`,paymentAmount:0,lessonPrice:0},state:`open`},this.lessons,this.modalLessonCompleted),r=e?k(e.number,this.lessons):[];return`
      <div class="modal modal--wide">
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

          <section class="form-section payment-section" aria-labelledby="payment-heading">
            <h3 id="payment-heading" class="form-section__title">Оплата</h3>
            <label>Цена одного занятия (₽)
              <input name="lessonPrice" type="number" min="0" step="100" value="${e?.meta.lessonPrice??0}" />
            </label>
            <label>Уже внесено (₽)
              <input name="paymentAmount" type="number" min="0" step="100" value="${e?.meta.paymentAmount??0}" />
            </label>
            ${r.length?`
              <div class="lesson-checklist">
                <p class="lesson-checklist__title">Занятия</p>
                ${r.map(e=>{let t=this.modalLessonCompleted.get(e.number)??O(e);return`
                      <label class="lesson-checklist__item${new Date(e.meta.end)<new Date?` lesson-checklist__item--past`:``}">
                        <input
                          type="checkbox"
                          name="lesson-completed-${e.number}"
                          data-lesson-number="${e.number}"
                          ${t?`checked`:``}
                        />
                        <span class="lesson-checklist__when">${Z(Se(e.meta.start,e.meta.end))}</span>
                        <span class="lesson-checklist__badge">Проведено</span>
                      </label>
                    `}).join(``)}
              </div>
            `:`<p class="hint">Занятия появятся в расписании — отметки «Проведено» можно будет поставить здесь.</p>`}
            ${q(n)}
          </section>

          <section class="form-section contact-section" aria-labelledby="contact-heading">
            <h3 id="contact-heading" class="form-section__title">Родители и связь</h3>
            <label>Телефон родителя 1
              <div class="contact-row">
                <input name="parentPhone1" type="tel" value="${Q(e?.meta.parentPhone1??``)}" placeholder="+7 900 000-00-00" />
                <span data-contact-link="parentPhone1">${J(e?.meta.parentPhone1)}</span>
              </div>
            </label>
            <label>Телефон родителя 2
              <div class="contact-row">
                <input name="parentPhone2" type="tel" value="${Q(e?.meta.parentPhone2??``)}" placeholder="+7 900 000-00-00" />
                <span data-contact-link="parentPhone2">${J(e?.meta.parentPhone2)}</span>
              </div>
            </label>
            <label>Max (ссылка на чат)
              <div class="contact-row">
                <input name="maxUrl" type="url" value="${Q(e?.meta.maxUrl??``)}" placeholder="https://max.ru/…" />
                <span data-contact-link="maxUrl">${Y(e?.meta.maxUrl,`Max`)}</span>
              </div>
            </label>
            <label>Telegram
              <div class="contact-row">
                <input name="telegramUrl" type="url" value="${Q(e?.meta.telegramUrl??``)}" placeholder="https://t.me/…" />
                <span data-contact-link="telegramUrl">${Y(e?.meta.telegramUrl,`Telegram`)}</span>
              </div>
            </label>
          </section>

          <label>Заметки<textarea name="notes" rows="3">${Z(e?.notes??``)}</textarea></label>
          <div class="modal__actions">
            <button class="btn btn--ghost" type="button" data-action="close-modal">Отмена</button>
            <button class="btn" type="submit">${e?`Сохранить`:`Создать`}</button>
          </div>
        </form>
      </div>
    `}renderModalContent(){if(!this.modal)return``;if(this.modal===`overlap`)return`
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
      `;if(this.modal===`student`)return this.renderStudentModal();let e=this.editingLesson,t=e?.meta.studentNumber??this.students[0]?.number??0,n=e?d(e.meta.start):this.pendingLessonStart?X(this.pendingLessonStart):Ce(this.selectedDay),r=e?d(e.meta.end):this.pendingLessonEnd?X(this.pendingLessonEnd):we(this.selectedDay);return`
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
    `,document.body.classList.add(`modal-open`),this.attachEscapeHandler(),this.bindModalEvents()}attachEscapeHandler(){this.detachEscapeHandler(),this.escapeHandler=e=>{e.key===`Escape`&&this.modal&&(this.modal===`overlap`?(this.modal=`lesson`,this.overlapMessage=null):this.closeModal(),this.render())},document.addEventListener(`keydown`,this.escapeHandler)}detachEscapeHandler(){this.escapeHandler&&=(document.removeEventListener(`keydown`,this.escapeHandler),null)}snapshotData(){return{students:this.students.map(e=>({...e,meta:{...e.meta}})),lessons:this.lessons.map(e=>({...e,meta:{...e.meta}}))}}restoreSnapshot(e){this.students=e.students,this.lessons=e.lessons,this.render()}showSyncToast(e){this.toastHost.innerHTML=`<div class="sync-toast" role="alert">${Z(e)}</div>`,window.setTimeout(()=>{this.toastHost.innerHTML=``},6e3)}syncInBackground(e,t,n){e.catch(e=>{t(),this.showSyncToast(e instanceof Error?e.message:n)})}createTempStudent(e,t){let n=-Date.now();return{id:n,number:n,name:e.name,notes:e.notes,meta:{...e.meta,lessonPrice:e.meta.lessonPrice??0,photoUrl:t??e.meta.photoUrl},state:`open`}}readStudentInputFromForm(e){let t=new FormData(e),n=Number(t.get(`lessonPrice`)??0),r=Number(t.get(`paymentAmount`)??0),i=e=>String(t.get(e)??``).trim()||void 0,a=r>0?`partial`:`unpaid`;return this.editingStudent&&(a=j(A({...this.editingStudent,meta:{...this.editingStudent.meta,lessonPrice:n,paymentAmount:r}},this.lessons,this.modalLessonCompleted))),{name:String(t.get(`name`)??``).trim(),notes:String(t.get(`notes`)??``).trim(),meta:{course:String(t.get(`course`)??``).trim(),paymentStatus:a,paymentAmount:r,lessonPrice:n,parentPhone1:i(`parentPhone1`),parentPhone2:i(`parentPhone2`),maxUrl:i(`maxUrl`),telegramUrl:i(`telegramUrl`),photoUrl:this.editingStudent?.meta.photoUrl}}}collectLessonCompletionUpdates(){let e=[];for(let[t,n]of this.modalLessonCompleted){let r=this.lessons.find(e=>e.number===t);r&&r.meta.completed!==n&&e.push({lesson:r,completed:n})}return e}updatePaymentSummaryInModal(e){if(!this.editingStudent)return;let t=Number(e.querySelector(`[name=lessonPrice]`)?.value??0),n=Number(e.querySelector(`[name=paymentAmount]`)?.value??0),r=k(this.editingStudent.number,this.lessons),i=0;for(let t of r)e.querySelector(`[data-lesson-number="${t.number}"]`)?.checked&&(i+=1);let a=i*t,o={totalLessons:r.length,completedLessons:i,lessonPrice:t,dueNow:a,paid:n,remainder:Math.max(0,a-n),overpayment:Math.max(0,n-a)},s=e.querySelector(`[data-payment-summary]`);s&&(s.outerHTML=q(o))}updateContactLinksInModal(e){let t=String(e.querySelector(`[name=parentPhone1]`)?.value??``).trim(),n=String(e.querySelector(`[name=parentPhone2]`)?.value??``).trim(),r=String(e.querySelector(`[name=maxUrl]`)?.value??``).trim(),i=String(e.querySelector(`[name=telegramUrl]`)?.value??``).trim();e.querySelector(`[data-contact-link="parentPhone1"]`).innerHTML=J(t),e.querySelector(`[data-contact-link="parentPhone2"]`).innerHTML=J(n),e.querySelector(`[data-contact-link="maxUrl"]`).innerHTML=Y(r,`Max`),e.querySelector(`[data-contact-link="telegramUrl"]`).innerHTML=Y(i,`Telegram`)}createTempLesson(e){let t=-Date.now();return{id:t,number:t,title:e.title,notes:e.notes,meta:{...e.meta},state:`open`}}bindEvents(){this.root.querySelector(`[data-action="toggle-theme"]`)?.addEventListener(`click`,()=>{this.theme=this.theme===`dark`?`light`:`dark`,he(this.theme),H(this.theme),this.render()}),this.root.querySelector(`[data-action="refresh"]`)?.addEventListener(`click`,()=>void this.refreshAll(!0)),this.root.querySelector(`[data-action="open-settings"]`)?.addEventListener(`click`,()=>{this.modal=`settings`,this.renderModalOverlay()}),this.root.querySelector(`[data-action="notify-permission"]`)?.addEventListener(`click`,()=>{N().then(e=>{this.error=e?null:`Разрешите уведомления в браузере.`,this.render()})}),this.root.querySelectorAll(`[data-action="tab"]`).forEach(e=>{e.addEventListener(`click`,()=>{this.tab=e.dataset.tab,this.render()})}),this.root.querySelector(`[data-action="new-student"]`)?.addEventListener(`click`,()=>{this.editingStudent=null,this.modalLessonCompleted.clear(),this.clearPhotoPreview(),this.modal=`student`,this.render()}),this.root.querySelectorAll(`[data-action="edit-student"]`).forEach(e=>{e.addEventListener(`click`,()=>this.openStudentEdit(Number(e.dataset.number))),e.addEventListener(`keydown`,t=>{let n=t;(n.key===`Enter`||n.key===` `)&&(n.preventDefault(),this.openStudentEdit(Number(e.dataset.number)))})}),this.root.querySelector(`[data-action="pick-slot"]`)?.addEventListener(`click`,e=>{if(!e.target.closest(`.lesson-block`)){if(!this.students.length){this.error=`Сначала добавьте ученика.`,this.render();return}this.openLessonAtClick(e)}}),this.root.querySelectorAll(`[data-action="edit-lesson"]`).forEach(e=>{e.addEventListener(`click`,t=>{t.stopPropagation();let n=Number(e.dataset.number);this.editingLesson=this.lessons.find(e=>e.number===n)??null,this.modal=`lesson`,this.render()})}),this.root.querySelector(`[data-action="prev-month"]`)?.addEventListener(`click`,()=>{this.viewMonth=new Date(this.viewMonth.getFullYear(),this.viewMonth.getMonth()-1,1),this.render()}),this.root.querySelector(`[data-action="next-month"]`)?.addEventListener(`click`,()=>{this.viewMonth=new Date(this.viewMonth.getFullYear(),this.viewMonth.getMonth()+1,1),this.render()}),this.root.querySelectorAll(`[data-action="select-day"]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.day;t&&(this.selectedDay=l(new Date(t)),this.render())})})}bindModalEvents(){let e=this.modalHost.querySelector(`[data-action="overlay-backdrop"]`);e?.addEventListener(`click`,t=>{t.target===e&&this.modal!==`overlap`&&(this.closeModal(),this.render())}),this.modalHost.querySelector(`[data-action="close-modal"]`)?.addEventListener(`click`,()=>{if(this.modal===`overlap`){this.modal=`lesson`,this.overlapMessage=null,this.renderModalOverlay();return}this.closeModal(),this.render()});let t=this.modalHost.querySelector(`form[data-form="settings"]`);t?.addEventListener(`submit`,e=>{e.preventDefault();let n=new FormData(t);this.config={owner:String(n.get(`owner`)??``).trim(),repo:String(n.get(`repo`)??``).trim(),token:String(n.get(`token`)??``).trim(),demoMode:n.get(`demoMode`)===`on`,assetsOwner:this.config.assetsOwner,assetsRepo:this.config.assetsRepo},me(this.config),this.closeModal(),this.refreshAll(!0)});let n=this.modalHost.querySelector(`form[data-form="student"]`);if(n?.addEventListener(`submit`,e=>{e.preventDefault(),this.submitStudentForm(n)}),n?.querySelector(`[data-action="pick-photo"]`)?.addEventListener(`click`,()=>{n.querySelector(`.photo-picker__input`)?.click()}),n?.querySelector(`.photo-picker__input`)?.addEventListener(`change`,e=>{let t=e.target.files?.[0];t&&(this.pendingPhoto=t,this.revokePhotoPreview(),this.photoPreviewUrl=URL.createObjectURL(t),this.renderModalOverlay())}),n){let e=()=>this.updatePaymentSummaryInModal(n),t=()=>this.updateContactLinksInModal(n);n.querySelectorAll(`[name=lessonPrice], [name=paymentAmount]`).forEach(t=>{t.addEventListener(`input`,e)}),n.querySelectorAll(`[data-lesson-number]`).forEach(t=>{t.addEventListener(`change`,t=>{let n=t.target,r=Number(n.dataset.lessonNumber);this.modalLessonCompleted.set(r,n.checked),e()})}),n.querySelectorAll(`[name=parentPhone1], [name=parentPhone2], [name=maxUrl], [name=telegramUrl]`).forEach(e=>{e.addEventListener(`input`,t)})}let r=this.modalHost.querySelector(`form[data-form="lesson"]`);r?.addEventListener(`submit`,e=>{e.preventDefault(),this.submitLessonForm(r)}),this.modalHost.querySelector(`[data-action="delete-lesson"]`)?.addEventListener(`click`,()=>{this.editingLesson&&this.deleteLesson(this.editingLesson.number)})}openStudentEdit(e){this.editingStudent=this.students.find(t=>t.number===e)??null,this.editingStudent&&this.initModalLessonCompleted(this.editingStudent.number),this.clearPhotoPreview(),this.modal=`student`,this.render()}openLessonAtClick(e){let t=e.currentTarget.getBoundingClientRect(),n=480+(e.clientY-t.top)/t.height*840,r=Math.floor(n/60),i=Math.floor(n%60/15)*15,a=new Date(this.selectedDay);a.setHours(r,i,0,0);let o=new Date(a);o.setMinutes(o.getMinutes()+ye),this.editingLesson=null,this.modal=`lesson`,this.pendingLessonStart=a,this.pendingLessonEnd=o,this.render()}closeModal(){this.modal=null,this.editingStudent=null,this.editingLesson=null,this.pendingPhoto=null,this.pendingLessonStart=null,this.pendingLessonEnd=null,this.overlapMessage=null,this.modalLessonCompleted.clear(),this.clearPhotoPreview(),this.modalHost.innerHTML=``,document.body.classList.remove(`modal-open`),this.detachEscapeHandler()}clearPhotoPreview(){this.revokePhotoPreview(),this.photoPreviewUrl=null}revokePhotoPreview(){this.photoPreviewUrl?.startsWith(`blob:`)&&URL.revokeObjectURL(this.photoPreviewUrl)}submitStudentForm(e){let t=this.readStudentInputFromForm(e),n=this.pendingPhoto,r=n?URL.createObjectURL(n):void 0,i=this.editingStudent,a=this.collectLessonCompletionUpdates(),o=this.snapshotData();this.closeModal(),this.render();for(let{lesson:e,completed:t}of a){let n=this.lessons.findIndex(t=>t.number===e.number);n>=0&&(this.lessons[n]={...e,meta:{...e.meta,completed:t}})}if(i){let e=this.students.findIndex(e=>e.number===i.number);e>=0&&(this.students[e]={...i,name:t.name,notes:t.notes,meta:{...t.meta,photoUrl:r??t.meta.photoUrl}}),this.render(),this.syncInBackground((async()=>{let e=S(this.config),r=await e.updateStudent({...t,number:i.number});if(n){let i=await e.uploadStudentPhoto(r.number,n);r=await e.updateStudent({...t,number:r.number,meta:{...t.meta,photoUrl:i}})}for(let{lesson:t,completed:n}of a){let r=await e.updateLesson({number:t.number,title:t.title,notes:t.notes,meta:{...t.meta,completed:n}}),i=this.lessons.findIndex(e=>e.number===t.number);i>=0&&(this.lessons[i]=r)}let o=this.students.findIndex(e=>e.number===i.number);o>=0&&(this.students[o]=r),this.render()})(),()=>this.restoreSnapshot(o),`Не удалось сохранить ученика`);return}let s=this.createTempStudent(t,r);this.students.push(s),this.render(),this.syncInBackground((async()=>{let e=S(this.config),r=await e.createStudent(t);if(n){let i=await e.uploadStudentPhoto(r.number,n);r=await e.updateStudent({...t,number:r.number,meta:{...t.meta,photoUrl:i}})}let i=this.students.findIndex(e=>e.number===s.number);i>=0&&(this.students[i]=r),this.render()})(),()=>this.restoreSnapshot(o),`Не удалось создать ученика`)}submitLessonForm(e){let t=new FormData(e),n=Number(t.get(`studentNumber`)),r=this.studentByNumber(n),i={studentNumber:n,start:f(String(t.get(`start`))),end:f(String(t.get(`end`)))},a=w(i,this.lessons,this.editingLesson?.number);if(a){let e=this.studentByNumber(a.meta.studentNumber);this.overlapMessage=`Пересечение с «${e?.name??`учеником`}» (${G(a.meta.start,a.meta.end)}).`,this.modal=`overlap`,this.renderModalOverlay();return}let o={title:`Занятие: ${r?.name??`Ученик`}`,notes:String(t.get(`notes`)??``).trim(),meta:i},s=this.editingLesson,c=this.snapshotData();if(this.closeModal(),this.render(),s){let e=this.lessons.findIndex(e=>e.number===s.number);e>=0&&(this.lessons[e]={...s,title:o.title,notes:o.notes,meta:o.meta}),this.render(),this.syncInBackground((async()=>{let e=await S(this.config).updateLesson({...o,number:s.number}),t=this.lessons.findIndex(e=>e.number===s.number);t>=0&&(this.lessons[t]=e),this.render()})(),()=>this.restoreSnapshot(c),`Не удалось сохранить занятие`);return}let l=this.createTempLesson(o);this.lessons.push(l),this.render(),this.syncInBackground((async()=>{let e=await S(this.config).createLesson(o),t=this.lessons.findIndex(e=>e.number===l.number);t>=0&&(this.lessons[t]=e),this.render()})(),()=>this.restoreSnapshot(c),`Не удалось создать занятие`)}deleteLesson(e){if(!confirm(`Отменить занятие (issue будет закрыт)?`))return;let t=this.snapshotData();this.closeModal(),this.lessons=this.lessons.filter(t=>t.number!==e),this.render(),this.syncInBackground(S(this.config).deleteLesson(e).then(()=>void 0),()=>this.restoreSnapshot(t),`Не удалось удалить занятие`)}};function W(e,t){return e.getFullYear()===t.getFullYear()&&e.getMonth()===t.getMonth()&&e.getDate()===t.getDate()}function xe(e){return e.toLocaleDateString(`ru-RU`,{weekday:`long`,day:`numeric`,month:`long`,year:`numeric`})}function G(e,t){let n={hour:`2-digit`,minute:`2-digit`};return`${new Date(e).toLocaleTimeString(`ru-RU`,n)} – ${new Date(t).toLocaleTimeString(`ru-RU`,n)}`}function K(e){return new Intl.NumberFormat(`ru-RU`).format(e)+` ₽`}function Se(e,t){let n=new Date(e),r=new Date(t),i=n.toLocaleDateString(`ru-RU`,{weekday:`short`,day:`numeric`,month:`short`}),a={hour:`2-digit`,minute:`2-digit`};return`${i}, ${`${n.toLocaleTimeString(`ru-RU`,a)} – ${r.toLocaleTimeString(`ru-RU`,a)}`}`}function q(e){let t=e.overpayment>0?`<p class="payment-summary__row payment-summary__row--overpay"><span>Переплата</span><strong>${K(e.overpayment)}</strong></p>`:`<p class="payment-summary__row payment-summary__row--debt"><span>Остаток</span><strong>${K(e.remainder)}</strong></p>`;return`
    <div class="payment-summary" data-payment-summary>
      <p class="payment-summary__row"><span>Занятий</span><strong>${e.completedLessons} / ${e.totalLessons} проведено</strong></p>
      <p class="payment-summary__row payment-summary__row--highlight"><span>Сейчас к оплате</span><strong>${K(e.dueNow)}</strong></p>
      <p class="payment-summary__row"><span>Уже внесено</span><strong>${K(e.paid)}</strong></p>
      ${t}
    </div>
  `}function J(e){let t=e?.trim();return t?`<a class="btn btn--ghost btn--sm contact-link" href="${Q(`tel:${ue(t)}`)}">Позвонить</a>`:``}function Y(e,t=`Написать`){let n=e?.trim();return n?`<a class="btn btn--ghost btn--sm contact-link" href="${Q(n)}" target="_blank" rel="noopener noreferrer">${Z(t)}</a>`:``}function Ce(e){let t=new Date(e);return t.setHours(10,0,0,0),X(t)}function we(e){let t=new Date(e);return t.setHours(11,0,0,0),X(t)}function X(e){let t=e.getTimezoneOffset()*6e4;return new Date(e.getTime()-t).toISOString().slice(0,16)}function Z(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`)}function Q(e){return Z(e).replaceAll(`'`,`&#39;`)}H(V());var $=document.getElementById(`app`);if(!$)throw Error(`Не найден корневой элемент #app`);new be($);