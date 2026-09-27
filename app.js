

const titles={dashboard:"Dashboard",enrollment:"New Enrollment",records:"Enrollment Records",trash:"Trash",print:"Print",logs:"Activity Logs",settings:"System Settings",logout:"Logout"};
const SESSION_KEY="tnhsCesSession",RECORDS_KEY="tnhsEnrollmentRecords",LOGS_KEY="tnhsActivityLogs",ACCOUNT_KEY="tnhsAdminAccount";
const DEFAULT_ACCOUNT={username:"admin",password:"tnhs2026",displayName:"Admin"};
const loginScreen=document.getElementById("loginScreen"),appShell=document.querySelector(".app");
const loginForm=document.getElementById("loginForm"),loginError=document.getElementById("loginError"),usernameInput=document.getElementById("username"),passwordInput=document.getElementById("password"),rememberMe=document.getElementById("rememberMe"),togglePassword=document.getElementById("togglePassword");
const enrollmentForm=document.getElementById("enrollmentForm");
let currentStep=1,lastSavedRecord=null,currentRecordId=null;

function getRecords(){try{return JSON.parse(localStorage.getItem(RECORDS_KEY)||"[]")}catch{return[]}}
const TRASH_RETENTION_DAYS=30,TRASH_RETENTION_MS=TRASH_RETENTION_DAYS*24*60*60*1000;
function purgeExpiredTrash(){const now=Date.now(),records=getRecords(),expired=records.filter(r=>r.deletedAt&&now-new Date(r.deletedAt).getTime()>=TRASH_RETENTION_MS);if(!expired.length)return;const keep=records.filter(r=>!(r.deletedAt&&now-new Date(r.deletedAt).getTime()>=TRASH_RETENTION_MS));setRecords(keep);const logs=getLogs();expired.forEach(r=>logs.push({timestamp:new Date().toISOString(),user:currentUser(),action:"Automatically removed expired enrollment record",recordId:r.recordId}));setLogs(logs)}
function getActiveRecords(){purgeExpiredTrash();return getRecords().filter(r=>!r.deletedAt)}
function getTrashRecords(){purgeExpiredTrash();return getRecords().filter(r=>!!r.deletedAt)}
function getAccount(){try{return {...DEFAULT_ACCOUNT,...JSON.parse(localStorage.getItem(ACCOUNT_KEY)||"{}")}}catch{return {...DEFAULT_ACCOUNT}}}
function setAccount(v){localStorage.setItem(ACCOUNT_KEY,JSON.stringify(v))}
function currentUser(){return getAccount().username}
function setRecords(v){localStorage.setItem(RECORDS_KEY,JSON.stringify(v))}
function getLogs(){try{return JSON.parse(localStorage.getItem(LOGS_KEY)||"[]")}catch{return[]}}
function setLogs(v){localStorage.setItem(LOGS_KEY,JSON.stringify(v))}
function formatTime(v){const d=new Date(v);return Number.isNaN(d.getTime())?"—":d.toLocaleString([],{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"})}
function formatDate(v){if(!v)return"—";const d=new Date(v+"T00:00:00");return Number.isNaN(d.getTime())?v:d.toLocaleDateString([],{month:"short",day:"numeric",year:"numeric"})}
function actionClass(a){a=(a||"").toLowerCase();return a.includes("created")?"created":a.includes("updated")?"updated":a.includes("generated")||a.includes("printed")?"printed":""}
function updateDashboard(){const r=getActiveRecords(),l=getLogs(),g11=r.filter(x=>String(x.gradeLevel||"")==="11").length,g12=r.filter(x=>String(x.gradeLevel||"")==="12").length,total=g11+g12;document.getElementById("totalRecords").textContent=r.length;document.getElementById("grade11Count").textContent=g11;document.getElementById("grade12Count").textContent=g12;const p11=total?Math.round(g11/total*100):0,p12=total?Math.round(g12/total*100):0;document.getElementById("grade11Percent").textContent=p11+"%";document.getElementById("grade12Percent").textContent=p12+"%";document.getElementById("grade11Bar").style.width=p11+"%";document.getElementById("grade12Bar").style.width=p12+"%";document.getElementById("distributionEmpty").style.display=total?"none":"block";const cutoff=Date.now()-24*60*60*1000;const recent=l.filter(x=>{const t=new Date(x.timestamp||0).getTime();return Number.isFinite(t)&&t>=cutoff}).sort((a,b)=>new Date(b.timestamp||0)-new Date(a.timestamp||0)).slice(0,6);document.getElementById("recentActivityBody").innerHTML=recent.length?recent.map(x=>`<tr><td><span class="activity-badge ${actionClass(x.action)}">${esc(x.action||"Activity")}</span></td><td>${esc(x.recordId||"—")}</td><td>${formatTime(x.timestamp)}</td></tr>`).join(""):'<tr><td class="empty" colspan="3">No activity yet.</td></tr>'}
function resetModuleViews(){document.getElementById("recordsListView").style.display="block";document.getElementById("individualRecordView").style.display="none";document.getElementById("editRecordView").style.display="none"}
function showPage(id){document.querySelectorAll(".screen,.placeholder").forEach(x=>x.style.display=x.id===id?"block":"none");const recordsList=document.getElementById("recordsListView"),individual=document.getElementById("individualRecordView"),edit=document.getElementById("editRecordView");if(recordsList)recordsList.style.display=id==="records"?"block":"none";if(individual&&id!=="records")individual.style.display="none";if(edit&&id!=="records")edit.style.display="none";document.querySelectorAll("[data-page]").forEach(x=>x.classList.toggle("active",x.dataset.page===id));document.getElementById("title").textContent=titles[id]||"Dashboard";if(id==="dashboard")updateDashboard();if(id==="records"){resetModuleViews();renderRecords()}if(id==="trash"){renderTrash()}if(id==="print"){populatePrintRecords();renderSelectedPrint()}if(id==="logs")renderLogs();if(id==="settings")renderSettings();if(id==="enrollment")showEnrollmentMode("form")}
function setLoggedIn(u){const a=getAccount();loginScreen.style.display="none";appShell.style.display="flex";document.querySelector(".avatar").textContent=(a.displayName||u).charAt(0).toUpperCase();document.querySelector(".user").lastChild.textContent=a.displayName||u;showPage("dashboard")}
function setLoggedOut(){localStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(SESSION_KEY);loginScreen.style.display="grid";appShell.style.display="none";usernameInput.value="";passwordInput.value="";rememberMe.checked=readRememberSetting();loginError.style.display="none"}
function saveSession(u){const p=JSON.stringify({username:u,loggedInAt:new Date().toISOString()});if(rememberMe.checked){localStorage.setItem(SESSION_KEY,p);sessionStorage.removeItem(SESSION_KEY)}else{sessionStorage.setItem(SESSION_KEY,p);localStorage.removeItem(SESSION_KEY)}}
function readSession(){try{const raw=localStorage.getItem(SESSION_KEY)||sessionStorage.getItem(SESSION_KEY);return raw?JSON.parse(raw):null}catch{return null}}
loginForm.addEventListener("submit",e=>{e.preventDefault();const a=getAccount(),u=usernameInput.value.trim(),p=passwordInput.value;if(u===a.username&&p===a.password){saveSession(u);loginError.style.display="none";setLoggedIn(u)}else{loginError.style.display="block";passwordInput.focus()}});
togglePassword.addEventListener("click",()=>{const v=passwordInput.type==="text";passwordInput.type=v?"password":"text";togglePassword.textContent=v?"Show":"Hide"});
document.querySelectorAll("[data-page]").forEach(el=>el.addEventListener("click",()=>{const p=el.dataset.page;if(p==="logout"){setLoggedOut();return}showPage(p)}));
document.getElementById("dashboardSearchBtn").addEventListener("click",()=>{const q=document.getElementById("dashboardSearch").value.trim();if(q){document.getElementById("recordsSearch").value=q;showPage("records")}else showPage("records")});
document.getElementById("dashboardSearch").addEventListener("keydown",e=>{if(e.key==="Enter")document.getElementById("dashboardSearchBtn").click()});
document.getElementById("dashboardSearchAction").addEventListener("click",()=>showPage("records"));document.getElementById("dashboardNewEnrollmentAction").addEventListener("click",()=>{resetEnrollment();showPage("enrollment")});document.getElementById("dashboardViewRecordsAction").addEventListener("click",()=>showPage("records"));document.getElementById("dashboardPrintAction").addEventListener("click",()=>showPage("print"));

function setFieldInvalid(id,on){const el=document.getElementById(id);if(!el)return;el.closest(".form-field")?.classList.toggle("invalid",on)}
function validateStep(step){let ok=true;const req=step===1?["schoolYear","gradeLevel","lrn","birthdate"]:[];req.forEach(id=>{const e=document.getElementById(id),bad=!e||!String(e.value).trim();setFieldInvalid(id,bad);if(bad)ok=false});if(step===1&&document.getElementById("lrn").value.trim()&&!/^\d{12}$/.test(document.getElementById("lrn").value.trim())){setFieldInvalid("lrn",true);ok=false}if(step===3){["fatherContact","motherContact","guardianContact"].forEach(id=>{const e=document.getElementById(id);if(!e||e.disabled)return;const v=String(e.value||"").trim();const bad=!!v&&!/^09\d{9}$/.test(v);setFieldInvalid(id,bad);if(bad)ok=false})}return ok}
function showStep(step){currentStep=Math.max(1,Math.min(5,step));document.querySelectorAll(".enroll-step").forEach(x=>x.style.display=Number(x.dataset.formStep)===currentStep?"block":"none");document.querySelectorAll(".step").forEach(x=>{const n=Number(x.dataset.step);x.classList.toggle("active",n===currentStep);x.classList.toggle("done",n<currentStep)});document.getElementById("prevStep").disabled=currentStep===1;document.getElementById("nextStep").textContent=currentStep===5?"Continue to Review":"Next"}
document.querySelectorAll(".step").forEach(b=>b.addEventListener("click",()=>{const t=Number(b.dataset.step);if(t<=currentStep||validateStep(currentStep))showStep(t)}));
document.getElementById("prevStep").addEventListener("click",()=>currentStep>1?showStep(currentStep-1):showPage("dashboard"));
document.getElementById("nextStep").addEventListener("click",()=>{if(!validateStep(currentStep))return;if(currentStep===1){const lrn=val("lrn"),existing=getActiveRecords().find(r=>r.lrn===lrn&&lrn);if(existing){const go=confirm(`Possible Duplicate Record\n\nA learner with this LRN already exists (${existing.recordId}).\n\nChoose OK to view the existing record, or Cancel to continue this enrollment.`);if(go){showPage("records");openRecord(existing.recordId);return}}}if(currentStep<5)showStep(currentStep+1);else buildReview()});
function conditional(name,wrap){document.querySelectorAll(`input[name="${name}"]`).forEach(r=>r.addEventListener("change",()=>{document.getElementById(wrap).style.display=r.checked&&r.value==="Yes"?"block":"none"}))}
conditional("ipCommunity","ipSpecifyWrap");conditional("fourPs","fourPsWrap");
function setupParentAvailability(){[["fatherNotProvided","fatherFields",["fatherLast","fatherFirst","fatherMiddle","fatherContact"]],["motherNotProvided","motherFields",["motherLast","motherFirst","motherMiddle","motherContact"]]].forEach(([check,wrap,fields])=>{const c=document.getElementById(check);if(!c)return;c.addEventListener("change",()=>{const off=c.checked;document.getElementById(wrap).style.opacity=off?".55":"1";fields.forEach(id=>{const el=document.getElementById(id);el.disabled=off;if(off)el.value=""})})})}
setupParentAvailability();
document.querySelectorAll('input[name="sameAddress"]').forEach(r=>r.addEventListener("change",()=>{const yes=document.querySelector('input[name="sameAddress"]:checked')?.value==="Yes";document.getElementById("permanentFields").style.display=yes?"none":"block";if(yes)copyAddress()}));
function copyAddress(){const map={curHouse:"permHouse",curStreet:"permStreet",curBarangay:"permBarangay",curMunicipality:"permMunicipality",curProvince:"permProvince",curZip:"permZip"};Object.entries(map).forEach(([a,b])=>document.getElementById(b).value=document.getElementById(a).value)}
["curHouse","curStreet","curBarangay","curMunicipality","curProvince","curZip"].forEach(id=>document.getElementById(id).addEventListener("input",()=>{if(document.querySelector('input[name="sameAddress"]:checked')?.value==="Yes")copyAddress()}));

function val(id){return document.getElementById(id)?.value?.trim()||""}
function radio(name){return document.querySelector(`input[name="${name}"]:checked`)?.value||""}
function checks(name){return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(x=>x.value)}
function collectFormData(){
  return {schoolYear:val("schoolYear"),gradeLevel:val("gradeLevel"),psa:val("psa"),lrn:val("lrn"),lastName:val("lastName"),firstName:val("firstName"),middleName:val("middleName"),extensionName:val("extensionName"),birthdate:val("birthdate"),placeOfBirth:val("placeOfBirth"),
    currentAddress:{house:val("curHouse"),street:val("curStreet"),barangay:val("curBarangay"),municipality:val("curMunicipality"),province:val("curProvince"),zip:val("curZip"),country:val("curCountry")},
    permanentAddressSame:radio("sameAddress"),permanentAddress:{house:val("permHouse"),street:val("permStreet"),barangay:val("permBarangay"),municipality:val("permMunicipality"),province:val("permProvince"),zip:val("permZip")},
    father:{last:val("fatherLast"),first:val("fatherFirst"),middle:val("fatherMiddle"),contact:val("fatherContact"),notProvided:document.getElementById("fatherNotProvided")?.checked||false},mother:{last:val("motherLast"),first:val("motherFirst"),middle:val("motherMiddle"),contact:val("motherContact"),notProvided:document.getElementById("motherNotProvided")?.checked||false},
    age:val("age"),motherTongue:val("motherTongue"),with:radio("with"),returning:radio("returning"),sex:radio("sex"),ipCommunity:radio("ipCommunity"),ipSpecification:val("ipSpecification"),fourPs:radio("fourPs"),fourPsHouseholdId:val("fourPsHouseholdId"),
    guardian:{last:val("guardianLast"),first:val("guardianFirst"),middle:val("guardianMiddle"),contact:val("guardianContact")},lastGradeCompleted:val("lastGradeCompleted"),lastSchoolYear:val("lastSchoolYear"),lastSchoolAttended:val("lastSchoolAttended"),schoolId:val("schoolId"),semester:radio("semester"),track:val("track"),strand:val("strand"),
    parentGuardianPrintedName:val("parentGuardianPrintedName"),certificationDate:val("certificationDate"),modalities:checks("modalities")}}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function item(label,value){return `<div class="review-item"><span class="review-label">${esc(label)}</span><div class="review-value">${esc(value||"—")}</div></div>`}
function section(title,items,step){return `<div class="review-section"><div class="review-section-head"><strong>${esc(title)}</strong><button type="button" class="edit-section" data-edit-step="${step}">Edit</button></div><div class="review-grid">${items.join("")}</div></div>`}
function buildReview(){if(!validateStep(5))return;const d=collectFormData(),current=`${d.currentAddress.house}, ${d.currentAddress.street}, ${d.currentAddress.barangay}, ${d.currentAddress.municipality}, ${d.currentAddress.province}, ${d.currentAddress.zip}, ${d.currentAddress.country}`.replace(/^, |, $/g,""),permanent=d.permanentAddressSame==="Yes"?"Same as current address":`${d.permanentAddress.house}, ${d.permanentAddress.street}, ${d.permanentAddress.barangay}, ${d.permanentAddress.municipality}, ${d.permanentAddress.province}, ${d.permanentAddress.zip}`.replace(/^, |, $/g,"");document.getElementById("reviewBody").innerHTML=section("Enrollment & Learner Information",[item("School Year",d.schoolYear),item("Grade Level to Enroll",d.gradeLevel),item("PSA Birth Certificate No.",d.psa),item("LRN",d.lrn),item("Last Name",d.lastName),item("First Name",d.firstName),item("Middle Name",d.middleName),item("Extension Name",d.extensionName),item("Birthdate",d.birthdate),item("Place of Birth (Municipality/City)",d.placeOfBirth)],1)+section("Address Information",[item("Current Address",current),item("Permanent Address",permanent),item("Same as Current Address?",d.permanentAddressSame)],2)+section("Parent & Other Learner Information",[item("Father's Name",[d.father.last,d.father.first,d.father.middle].filter(Boolean).join(" ")),item("Father's Contact Number",d.father.contact),item("Mother's Maiden Name",[d.mother.last,d.mother.first,d.mother.middle].filter(Boolean).join(" ")),item("Mother's Contact Number",d.mother.contact),item("Age",d.age),item("Mother Tongue",d.motherTongue),item("With",d.with),item("Returning (Balik-Aral)",d.returning),item("Sex",d.sex),item("IP Community",d.ipCommunity),item("IP Specification",d.ipSpecification),item("4Ps Beneficiary",d.fourPs),item("4Ps Household ID",d.fourPsHouseholdId)],3)+section("Senior High School Information",[item("Guardian's Name",[d.guardian.last,d.guardian.first,d.guardian.middle].filter(Boolean).join(" ")),item("Guardian Contact Number",d.guardian.contact),item("Last Grade Level Completed",d.lastGradeCompleted),item("Last School Year Completed",d.lastSchoolYear),item("Last School Attended",d.lastSchoolAttended),item("School ID",d.schoolId),item("Semester",d.semester),item("Track",d.track),item("Strand",d.strand)],4)+section("Certification & Modality",[item("Signature Over Printed Name of Parent/Guardian",d.parentGuardianPrintedName),item("Date",d.certificationDate),item("Preferred Distance Learning Modality/ies",d.modalities.length?d.modalities.join(", "):"—")],5)+`<div class="confirm-box">Please review the information carefully before saving.</div>`;document.querySelectorAll(".edit-section").forEach(b=>b.addEventListener("click",()=>{showEnrollmentMode("form");showStep(Number(b.dataset.editStep))}));showEnrollmentMode("review")}
function showEnrollmentMode(mode){const formShell=document.querySelector("#enrollment > .enroll-shell"),review=document.getElementById("reviewView"),success=document.getElementById("saveSuccessView");if(formShell)formShell.style.display=mode==="form"?"block":"none";review.style.display=mode==="review"?"block":"none";success.style.display=mode==="success"?"block":"none"}
function generateRecordId(){const year=new Date().getFullYear().toString(),r=getRecords();let n=r.length+1;while(r.some(x=>x.recordId===`TNHS-${year}-${String(n).padStart(5,"0")}`))n++;return`TNHS-${year}-${String(n).padStart(5,"0")}`}
document.getElementById("confirmSave").addEventListener("click",()=>{const data=collectFormData(),records=getRecords(),logs=getLogs(),now=new Date().toISOString(),recordId=generateRecordId();const record={recordId,status:"Active",createdAt:now,updatedAt:now,createdBy:currentUser(),...data};records.push(record);setRecords(records);logs.push({timestamp:now,user:currentUser(),action:"Created enrollment record",recordId});setLogs(logs);lastSavedRecord=record;document.getElementById("savedRecordId").textContent=recordId;showEnrollmentMode("success");refreshAllDataViews()});
document.getElementById("backToForm").addEventListener("click",()=>showEnrollmentMode("form"));
document.getElementById("newEnrollmentAfterSave").addEventListener("click",()=>{resetEnrollment();showEnrollmentMode("form");showStep(1)});
document.getElementById("viewSavedRecord").addEventListener("click",()=>openRecord(lastSavedRecord?.recordId));
document.getElementById("printSavedRecord").addEventListener("click",()=>{if(lastSavedRecord)window.dispatchEvent(new CustomEvent("tnhs:print-record",{detail:lastSavedRecord}))});
function resetEnrollment(){enrollmentForm.reset();document.getElementById("curCountry").value="Philippines";document.getElementById("fatherFields").style.display="grid";document.getElementById("motherFields").style.display="grid";document.querySelector('input[name="sameAddress"][value="No"]').checked=true;document.getElementById("permanentFields").style.display="block";document.getElementById("ipSpecifyWrap").style.display="none";document.getElementById("fourPsWrap").style.display="none";document.getElementById("fatherNotProvided").checked=false;document.getElementById("motherNotProvided").checked=false;document.getElementById("fatherNotProvided").dispatchEvent(new Event("change"));document.getElementById("motherNotProvided").dispatchEvent(new Event("change"));document.querySelectorAll(".form-field.invalid").forEach(x=>x.classList.remove("invalid"));showStep(1)}
window.addEventListener("tnhs:reset-enrollment",resetEnrollment);

function refreshAllDataViews(){updateDashboard();renderRecords();renderTrash();populatePrintRecords();renderLogs();if(document.getElementById("print")?.style.display!=="none")renderSelectedPrint()}

/* 13F — Records */
function fullName(r){return[r.lastName,r.firstName,r.middleName,r.extensionName].filter(Boolean).join(" ")}
function renderRecords(){
  const q=(document.getElementById("recordsSearch").value||"").trim().toLowerCase(),g=document.getElementById("recordsGradeFilter").value,y=document.getElementById("recordsYearFilter").value,s=document.getElementById("recordsStatusFilter").value;
  const all=getActiveRecords().slice().sort((a,b)=>new Date(b.updatedAt||b.createdAt)-new Date(a.updatedAt||a.createdAt));
  const years=[...new Set(all.map(x=>x.schoolYear).filter(Boolean))].sort().reverse(),ys=document.getElementById("recordsYearFilter"),old=ys.value;ys.innerHTML='<option value="">All School Years</option>'+years.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join("");if(years.includes(old))ys.value=old;else ys.value=y;
  const rows=all.filter(r=>{const hay=[fullName(r),r.lrn,r.recordId,r.schoolYear].join(" ").toLowerCase();return(!q||hay.includes(q))&&(!g||String(r.gradeLevel)===g)&&(!ys.value||r.schoolYear===ys.value)&&(!s||r.status===s)});
  document.getElementById("recordsCount").textContent=`${rows.length} of ${all.length} record${all.length===1?"":"s"}`;
  document.getElementById("recordsEmpty").style.display=rows.length?"none":"block";
  document.getElementById("recordsTableBody").innerHTML=rows.map(r=>`<tr><td><span class="record-id-link" data-record="${esc(r.recordId)}">${esc(r.recordId)}</span></td><td><div class="record-name">${esc(fullName(r)||"Unnamed learner")}</div><div class="record-sub">${esc(r.createdBy||"—")}</div></td><td>${esc(r.lrn||"—")}</td><td>Grade ${esc(r.gradeLevel||"—")}</td><td>${esc(r.schoolYear||"—")}</td><td><span class="status-pill">${esc(r.status||"Active")}</span></td><td>${formatTime(r.updatedAt||r.createdAt)}</td><td><div class="row-actions"><button class="table-btn" data-action="view" data-record="${esc(r.recordId)}">View</button><button class="table-btn" data-action="edit" data-record="${esc(r.recordId)}">Edit</button><button class="table-btn danger-table-btn" data-action="trash" data-record="${esc(r.recordId)}">Move to Trash</button></div></td></tr>`).join("");
  document.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>{const action=b.dataset.action;if(action==="view")openRecord(b.dataset.record);else if(action==="edit")openEditRecord(b.dataset.record);else moveToTrash(b.dataset.record)}));
  document.querySelectorAll(".record-id-link").forEach(b=>b.addEventListener("click",()=>openRecord(b.dataset.record)));
}
function moveToTrash(id){const records=getRecords(),idx=records.findIndex(r=>r.recordId===id);if(idx<0)return;const r=records[idx];if(!confirm(`Move ${r.recordId} to Trash?\n\nThis record can be restored within 30 days before it is automatically removed.`))return;const now=new Date().toISOString();records[idx]={...r,deletedAt:now,updatedAt:now};setRecords(records);const logs=getLogs();logs.push({timestamp:now,user:currentUser(),action:"Moved enrollment record to Trash",recordId:id});setLogs(logs);refreshAllDataViews();showToast("Enrollment record moved to Trash.");}
function trashDaysLeft(v){const elapsed=Date.now()-new Date(v).getTime(),left=Math.max(0,Math.ceil((TRASH_RETENTION_MS-elapsed)/86400000));return left===1?"1 day left":`${left} days left`}
function renderTrash(){const body=document.getElementById("trashTableBody"),empty=document.getElementById("trashEmpty"),count=document.getElementById("trashCount");if(!body)return;const rows=getTrashRecords().slice().sort((a,b)=>new Date(b.deletedAt)-new Date(a.deletedAt));count.textContent=`${rows.length} record${rows.length===1?"":"s"}`;empty.style.display=rows.length?"none":"block";body.innerHTML=rows.map(r=>`<tr><td>${esc(r.recordId)}</td><td><div class="record-name">${esc(fullName(r)||"Unnamed learner")}</div><div class="record-sub">${esc(r.createdBy||"—")}</div></td><td>${esc(r.lrn||"—")}</td><td>Grade ${esc(r.gradeLevel||"—")}</td><td>${esc(r.schoolYear||"—")}</td><td><span class="trash-retention">${trashDaysLeft(r.deletedAt)}</span></td><td>${formatTime(r.deletedAt)}</td><td><button class="table-btn" data-trash-action="restore" data-record="${esc(r.recordId)}">Restore</button></td></tr>`).join("");body.querySelectorAll("[data-trash-action]").forEach(b=>b.addEventListener("click",()=>restoreFromTrash(b.dataset.record)));}
function restoreFromTrash(id){const records=getRecords(),idx=records.findIndex(r=>r.recordId===id);if(idx<0)return;const r=records[idx];if(!confirm(`Restore ${r.recordId} to Enrollment Records?`))return;const now=new Date().toISOString();records[idx]={...r,deletedAt:null,updatedAt:now,status:"Active"};setRecords(records);const logs=getLogs();logs.push({timestamp:now,user:currentUser(),action:"Restored enrollment record",recordId:id});setLogs(logs);refreshAllDataViews();showPage("trash");showToast("Enrollment record restored.");}

["recordsSearch","recordsGradeFilter","recordsYearFilter","recordsStatusFilter"].forEach(id=>document.getElementById(id).addEventListener(id==="recordsSearch"?"input":"change",renderRecords));
document.getElementById("newEnrollmentFromRecords").addEventListener("click",()=>{resetEnrollment();showPage("enrollment")});

function addressString(a){if(!a)return"—";return[a.house,a.street,a.barangay,a.municipality,a.province,a.zip,a.country].filter(Boolean).join(", ")||"—"}
function detailItem(label,value){return`<div class="detail-item"><span class="label">${esc(label)}</span><div class="value">${esc(value||"—")}</div></div>`}
function detailSection(title,items){return`<section class="detail-section"><h3>${esc(title)}</h3><div class="detail-grid">${items.join("")}</div></section>`}
function openRecord(id){
  const r=getRecords().find(x=>x.recordId===id);if(!r)return;
  currentRecordId=id;
  const name=fullName(r)||"Unnamed learner";
  document.getElementById("individualRecordView").innerHTML=`<div class="detail-shell">
    <div class="detail-head"><div><h2>${esc(name)}</h2><p>Enrollment record • ${esc(r.schoolYear||"—")} • Grade ${esc(r.gradeLevel||"—")}</p></div><div class="detail-meta"><span class="record-code">${esc(r.recordId)}</span><span class="detail-status status-pill">${esc(r.status||"Active")}</span></div></div>
    <div class="detail-actions"><button class="btn" id="backRecords">Back to Records</button><button class="btn" id="editCurrentRecord">Edit Record</button><button class="btn primary" id="printCurrentRecord">Print Form</button></div>
    <div class="detail-body">
      ${detailSection("Enrollment & Learner Information",[detailItem("School Year",r.schoolYear),detailItem("Grade Level to Enroll",r.gradeLevel),detailItem("PSA Birth Certificate No.",r.psa),detailItem("LRN",r.lrn),detailItem("Last Name",r.lastName),detailItem("First Name",r.firstName),detailItem("Middle Name",r.middleName),detailItem("Extension Name",r.extensionName),detailItem("Birthdate",r.birthdate),detailItem("Place of Birth (Municipality/City)",r.placeOfBirth)])}
      ${detailSection("Address Information",[detailItem("Current Address",addressString(r.currentAddress)),detailItem("Permanent Address",r.permanentAddressSame==="Yes"?"Same as current address":addressString(r.permanentAddress)),detailItem("Same as Current Address?",r.permanentAddressSame)])}
      ${detailSection("Parent & Other Learner Information",[detailItem("Father's Name",[r.father?.last,r.father?.first,r.father?.middle].filter(Boolean).join(" ")),detailItem("Father's Contact Number",r.father?.contact),detailItem("Mother's Maiden Name",[r.mother?.last,r.mother?.first,r.mother?.middle].filter(Boolean).join(" ")),detailItem("Mother's Contact Number",r.mother?.contact),detailItem("Age",r.age),detailItem("Mother Tongue",r.motherTongue),detailItem("With",r.with),detailItem("Returning (Balik-Aral)",r.returning),detailItem("Sex",r.sex),detailItem("IP Community",r.ipCommunity),detailItem("IP Specification",r.ipSpecification),detailItem("4Ps Beneficiary",r.fourPs),detailItem("4Ps Household ID",r.fourPsHouseholdId)])}
      ${detailSection("Senior High School Information",[detailItem("Guardian's Name",[r.guardian?.last,r.guardian?.first,r.guardian?.middle].filter(Boolean).join(" ")),detailItem("Guardian Contact Number",r.guardian?.contact),detailItem("Last Grade Level Completed",r.lastGradeCompleted),detailItem("Last School Year Completed",r.lastSchoolYear),detailItem("Last School Attended",r.lastSchoolAttended),detailItem("School ID",r.schoolId),detailItem("Semester",r.semester),detailItem("Track",r.track),detailItem("Strand",r.strand)])}
      ${detailSection("Certification & Modality",[detailItem("Signature Over Printed Name of Parent/Guardian",r.parentGuardianPrintedName),detailItem("Date",r.certificationDate),detailItem("Preferred Distance Learning Modality/ies",r.modalities?.join(", ")),detailItem("Created",formatTime(r.createdAt)),detailItem("Last Updated",formatTime(r.updatedAt)),detailItem("Created By",r.createdBy)])}
    </div></div>`;
  document.getElementById("recordsListView").style.display="none";document.getElementById("editRecordView").style.display="none";document.getElementById("individualRecordView").style.display="block";
  document.getElementById("backRecords").onclick=()=>{resetModuleViews();renderRecords()};
  document.getElementById("editCurrentRecord").onclick=()=>openEditRecord(id);
  document.getElementById("printCurrentRecord").onclick=()=>window.dispatchEvent(new CustomEvent("tnhs:print-record",{detail:r}));
}
function editField(label,id,value,type="text"){const contact=["fatherContact","motherContact","guardianContact"].includes(id);return`<div class="edit-field"><label for="edit_${id}">${esc(label)}</label><input id="edit_${id}" type="${type}" value="${esc(value||"")}"${contact?' inputmode="numeric" maxlength="11" placeholder="09XXXXXXXXX"':''}></div>`}
function editSelect(label,id,value,options){return`<div class="edit-field"><label for="edit_${id}">${esc(label)}</label><select id="edit_${id}">${options.map(o=>`<option value="${esc(o)}" ${String(o)===String(value||"")?"selected":""}>${esc(o||"Select")}</option>`).join("")}</select></div>`}
function editChecks(label,id,values,selected){return`<div class="edit-field edit-checks"><label>${esc(label)}</label><div class="edit-check-grid">${values.map(v=>`<label class="choice"><input type="checkbox" name="edit_${id}" value="${esc(v)}" ${selected?.includes(v)?"checked":""}> ${esc(v)}</label>`).join("")}</div></div>`}
function openEditRecord(id){
  const r=getRecords().find(x=>x.recordId===id);if(!r)return;currentRecordId=id;
  const father=r.father||{},mother=r.mother||{},guardian=r.guardian||{};
  document.getElementById("editRecordView").innerHTML=`<div class="edit-shell"><div class="edit-head"><h2>Edit Enrollment Record</h2><p>Record ID: ${esc(r.recordId)}. The Record ID remains unchanged after saving.</p></div>
  <div class="edit-body"><div class="edit-grid">
    ${editField("School Year","schoolYear",r.schoolYear)}${editSelect("Grade Level to Enroll","gradeLevel",r.gradeLevel,["","11","12"])}${editField("PSA Birth Certificate No.","psa",r.psa)}${editField("LRN","lrn",r.lrn)}${editField("Last Name","lastName",r.lastName)}${editField("First Name","firstName",r.firstName)}${editField("Middle Name","middleName",r.middleName)}${editField("Extension Name","extensionName",r.extensionName)}${editField("Birthdate","birthdate",r.birthdate,"date")}${editField("Place of Birth (Municipality/City)","placeOfBirth",r.placeOfBirth)}
    ${editField("Current House No./Street","curHouse",r.currentAddress?.house)}${editField("Current Street Name","curStreet",r.currentAddress?.street)}${editField("Current Barangay","curBarangay",r.currentAddress?.barangay)}${editField("Current Municipality/City","curMunicipality",r.currentAddress?.municipality)}${editField("Current Province","curProvince",r.currentAddress?.province)}${editField("Current Zip Code","curZip",r.currentAddress?.zip)}${editField("Current Country","curCountry",r.currentAddress?.country)}${editSelect("Same as Current Address?","sameAddress",r.permanentAddressSame,["Yes","No"])}
    ${editField("Permanent House No./Street","permHouse",r.permanentAddress?.house)}${editField("Permanent Street Name","permStreet",r.permanentAddress?.street)}${editField("Permanent Barangay","permBarangay",r.permanentAddress?.barangay)}${editField("Permanent Municipality/City","permMunicipality",r.permanentAddress?.municipality)}${editField("Permanent Province","permProvince",r.permanentAddress?.province)}${editField("Permanent Zip Code","permZip",r.permanentAddress?.zip)}
    <div class="edit-field"><label class="choice"><input type="checkbox" id="edit_fatherNotProvided" ${father.notProvided?"checked":""}> Father information not provided</label></div>${editField("Father's Last Name","fatherLast",father.last)}${editField("Father's First Name","fatherFirst",father.first)}${editField("Father's Middle Name","fatherMiddle",father.middle)}${editField("Father's Contact Number","fatherContact",father.contact)}<div class="edit-field"><label class="choice"><input type="checkbox" id="edit_motherNotProvided" ${mother.notProvided?"checked":""}> Mother information not provided</label></div>${editField("Mother's Maiden Last Name","motherLast",mother.last)}${editField("Mother's Maiden First Name","motherFirst",mother.first)}${editField("Mother's Maiden Middle Name","motherMiddle",mother.middle)}${editField("Mother's Contact Number","motherContact",mother.contact)}${editField("Age","age",r.age)}${editField("Mother Tongue","motherTongue",r.motherTongue)}
    ${editSelect("With","with",r.with,["","Yes","No"])}${editSelect("Returning (Balik-Aral)","returning",r.returning,["","Yes","No"])}${editSelect("Sex","sex",r.sex,["","Male","Female"])}${editSelect("IP Community","ipCommunity",r.ipCommunity,["","Yes","No"])}${editField("IP Specification","ipSpecification",r.ipSpecification)}${editSelect("4Ps Beneficiary","fourPs",r.fourPs,["","Yes","No"])}${editField("4Ps Household ID","fourPsHouseholdId",r.fourPsHouseholdId)}
    ${editField("Guardian's Last Name","guardianLast",guardian.last)}${editField("Guardian's First Name","guardianFirst",guardian.first)}${editField("Guardian's Middle Name","guardianMiddle",guardian.middle)}${editField("Guardian Contact Number","guardianContact",guardian.contact)}${editField("Last Grade Level Completed","lastGradeCompleted",r.lastGradeCompleted)}${editField("Last School Year Completed","lastSchoolYear",r.lastSchoolYear)}${editField("Last School Attended","lastSchoolAttended",r.lastSchoolAttended)}${editField("School ID","schoolId",r.schoolId)}${editSelect("Semester","semester",r.semester,["","1st Sem","2nd Sem"])}${editField("Track","track",r.track)}${editField("Strand","strand",r.strand)}${editField("Parent/Guardian Printed Name","parentGuardianPrintedName",r.parentGuardianPrintedName)}${editField("Certification Date","certificationDate",r.certificationDate,"date")}
    ${editChecks("Preferred Distance Learning Modality/ies","modalities",["Modular (Print)","Online","Radio-Based Instruction","Blended","Modular (Digital)","Educational Television","Homeschooling","Face to Face"],r.modalities||[])}
  </div></div><div class="edit-actions"><button class="btn" id="cancelEdit" type="button">Cancel</button><button class="btn primary" id="saveRecordEdit" type="button">Save Changes</button></div></div>`;
  document.getElementById("recordsListView").style.display="none";document.getElementById("individualRecordView").style.display="none";document.getElementById("editRecordView").style.display="block";
  document.getElementById("cancelEdit").onclick=()=>openRecord(id);document.getElementById("saveRecordEdit").onclick=()=>saveRecordEdit(id);
  document.getElementById("edit_sameAddress").addEventListener("change",e=>{const disabled=e.target.value==="Yes";["permHouse","permStreet","permBarangay","permMunicipality","permProvince","permZip"].forEach(k=>document.getElementById("edit_"+k).disabled=disabled);});
  document.getElementById("edit_sameAddress").dispatchEvent(new Event("change"));
  [["edit_fatherNotProvided",["fatherLast","fatherFirst","fatherMiddle","fatherContact"]],["edit_motherNotProvided",["motherLast","motherFirst","motherMiddle","motherContact"]]].forEach(([cid,fields])=>{const c=document.getElementById(cid);const sync=()=>fields.forEach(k=>{const el=document.getElementById("edit_"+k);el.disabled=c.checked;if(c.checked)el.value=""});c.addEventListener("change",sync);sync()});
}
function editVal(id){return document.getElementById("edit_"+id)?.value?.trim()||""}
function saveRecordEdit(id){
  const records=getActiveRecords(),idx=records.findIndex(x=>x.recordId===id);if(idx<0)return;
  const r=records[idx],newLrn=editVal("lrn");
  if(!/^\d{12}$/.test(newLrn)){alert("LRN must contain exactly 12 digits.");return}
  const contactFields=[
    ["Father's Contact Number","fatherContact"],
    ["Mother's Contact Number","motherContact"],
    ["Guardian Contact Number","guardianContact"]
  ];
  for(const [label,key] of contactFields){const value=editVal(key);if(value&&!/^09\d{9}$/.test(value)){alert(`${label} must contain exactly 11 digits and start with 09.`);document.getElementById(`edit_${key}`)?.focus();return}}
  const duplicate=records.some((x,i)=>i!==idx&&x.lrn===newLrn&&newLrn&&!x.deletedAt);if(duplicate){alert("This LRN is already assigned to another enrollment record.");return}
  const now=new Date().toISOString(),same=editVal("sameAddress")||"No";
  const updated={...r,schoolYear:editVal("schoolYear"),gradeLevel:editVal("gradeLevel"),psa:editVal("psa"),lrn:newLrn,lastName:editVal("lastName"),firstName:editVal("firstName"),middleName:editVal("middleName"),extensionName:editVal("extensionName"),birthdate:editVal("birthdate"),placeOfBirth:editVal("placeOfBirth"),
    currentAddress:{...r.currentAddress,house:editVal("curHouse"),street:editVal("curStreet"),barangay:editVal("curBarangay"),municipality:editVal("curMunicipality"),province:editVal("curProvince"),zip:editVal("curZip"),country:editVal("curCountry")},
    permanentAddressSame:same,permanentAddress:{house:editVal("permHouse"),street:editVal("permStreet"),barangay:editVal("permBarangay"),municipality:editVal("permMunicipality"),province:editVal("permProvince"),zip:editVal("permZip")},
    father:{last:editVal("fatherLast"),first:editVal("fatherFirst"),middle:editVal("fatherMiddle"),contact:editVal("fatherContact"),notProvided:!!document.getElementById("edit_fatherNotProvided")?.checked},mother:{last:editVal("motherLast"),first:editVal("motherFirst"),middle:editVal("motherMiddle"),contact:editVal("motherContact"),notProvided:!!document.getElementById("edit_motherNotProvided")?.checked},age:editVal("age"),motherTongue:editVal("motherTongue"),with:editVal("with"),returning:editVal("returning"),sex:editVal("sex"),ipCommunity:editVal("ipCommunity"),ipSpecification:editVal("ipSpecification"),fourPs:editVal("fourPs"),fourPsHouseholdId:editVal("fourPsHouseholdId"),
    guardian:{last:editVal("guardianLast"),first:editVal("guardianFirst"),middle:editVal("guardianMiddle"),contact:editVal("guardianContact")},lastGradeCompleted:editVal("lastGradeCompleted"),lastSchoolYear:editVal("lastSchoolYear"),lastSchoolAttended:editVal("lastSchoolAttended"),schoolId:editVal("schoolId"),semester:editVal("semester"),track:editVal("track"),strand:editVal("strand"),parentGuardianPrintedName:editVal("parentGuardianPrintedName"),certificationDate:editVal("certificationDate"),modalities:[...document.querySelectorAll('input[name="edit_modalities"]:checked')].map(x=>x.value),updatedAt:now};
  if(same==="Yes")updated.permanentAddress={...updated.currentAddress};
  records[idx]=updated;setRecords(records);const logs=getLogs();logs.push({timestamp:now,user:currentUser(),action:"Updated enrollment record",recordId:id});setLogs(logs);lastSavedRecord=updated;refreshAllDataViews();showToast("Enrollment record updated.");openRecord(id);
}
function showToast(msg){const t=document.getElementById("toast");if(!t)return;t.textContent=msg;t.style.display="block";clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.style.display="none",2500)}


/* 13G — Print / Generate */
function populatePrintRecords(){
 const sel=document.getElementById("printRecordSelect"),records=getActiveRecords().slice().sort((a,b)=>new Date(b.updatedAt||b.createdAt)-new Date(a.updatedAt||a.createdAt)),selected=sel.value;
 sel.innerHTML='<option value="">Select an enrollment record</option>'+records.map(r=>`<option value="${esc(r.recordId)}">${esc(r.recordId)} — ${esc(fullName(r)||"Unnamed learner")} — Grade ${esc(r.gradeLevel||"—")}</option>`).join("");
 if(records.some(r=>r.recordId===selected))sel.value=selected;
}
function bval(v){return esc(v||"—")}
function field(label,value,cls=""){return`<div class="bfield ${cls}"><span class="blabel">${esc(label)}</span><div class="bvalue">${bval(value)}</div></div>`}
function personName(p){if(p?.notProvided)return"Not provided";return[p?.last,p?.first,p?.middle].filter(Boolean).join(" ")||"—"}
function modalityRows(r){
 const options=["Modular (Print)","Online","Radio-Based Instruction","Blended","Modular (Digital)","Educational Television","Homeschooling","Face to Face"],chosen=r.modalities||[];
 return options.map(x=>`<div class="modality"><span class="box ${chosen.includes(x)?"checked":""}"></span>${esc(x)}</div>`).join("")
}
function makeBEEF(r){
 const cur=r.currentAddress||{},perm=r.permanentAddress||{},same=r.permanentAddressSame==="Yes";
 const permText=same?"Same with Current Address":addressString(perm);
 return `<div class="beef-page">
  
  <h1 class="beef-title">ENHANCED BASIC EDUCATION ENROLLMENT FORM</h1>
  <div class="beef-subtitle">Talugtug National High School</div><div class="beef-rule"></div>
  <div class="beef-grid three">${field("School Year",r.schoolYear)}${field("Grade Level to Enroll",r.gradeLevel)}${field("LRN",r.lrn)}</div>
  <div class="beef-section-title">LEARNER INFORMATION</div>
  <div class="beef-grid">${field("PSA Birth Certificate No. (if available)",r.psa)}${field("Birthdate",r.birthdate)}${field("Last Name",r.lastName)}${field("First Name",r.firstName)}${field("Middle Name",r.middleName)}${field("Extension Name",r.extensionName)}${field("Place of Birth (Municipality/City)",r.placeOfBirth)}${field("Current Address",addressString(cur),"wide")}</div>
  <div class="beef-section-title">ADDRESS INFORMATION</div>
  <div class="beef-grid">${field("House No./Street",cur.house)}${field("Street Name",cur.street)}${field("Barangay",cur.barangay)}${field("Municipality/City",cur.municipality)}${field("Province",cur.province)}${field("Zip Code",cur.zip)}${field("Country",cur.country)}${field("Permanent Address",permText,"wide")}</div>
  <div class="beef-grid three">${field("Permanent — House No./Street",perm.house)}${field("Permanent — Street Name",perm.street)}${field("Permanent — Barangay",perm.barangay)}${field("Permanent — Municipality/City",perm.municipality)}${field("Permanent — Province",perm.province)}${field("Permanent — Zip Code",perm.zip)}</div>
  <div class="beef-section-title">PARENT'S / GUARDIAN'S INFORMATION</div>
  <div class="beef-grid">${field("Father's Name",personName(r.father))}${field("Father's Contact Number",r.father?.contact)}${field("Mother's Maiden Name",personName(r.mother))}${field("Mother's Contact Number",r.mother?.contact)}${field("Guardian's Name",personName(r.guardian))}${field("Guardian's Contact Number",r.guardian?.contact)}</div>
  <div class="beef-section-title">OTHER LEARNER INFORMATION</div>
  <div class="beef-grid three">${field("Age",r.age)}${field("Mother Tongue",r.motherTongue)}${field("Sex",r.sex)}${field("With",r.with)}${field("Returning (Balik-Aral)",r.returning)}${field("IP Community",r.ipCommunity)}${field("IP Specification",r.ipSpecification)}${field("4Ps Beneficiary",r.fourPs)}${field("4Ps Household ID",r.fourPsHouseholdId)}</div>
  
 </div>
 <div class="beef-page">
  
  <h1 class="beef-title">FOR LEARNERS IN SENIOR HIGH SCHOOL</h1><div class="beef-subtitle">Enrollment Information</div><div class="beef-rule"></div>
  <div class="beef-section-title">SENIOR HIGH SCHOOL INFORMATION</div>
  <div class="beef-grid three">${field("Last Grade Level Completed",r.lastGradeCompleted)}${field("Last School Year Completed",r.lastSchoolYear)}${field("School ID",r.schoolId)}${field("Last School Attended",r.lastSchoolAttended)}${field("Semester",r.semester)}${field("Track",r.track)}${field("Strand",r.strand)}</div>
  <div class="beef-section-title">GUARDIAN INFORMATION</div>
  <div class="beef-grid">${field("Guardian's Name",personName(r.guardian))}${field("Guardian Contact Number",r.guardian?.contact)}</div>
  <div class="beef-section-title">SYSTEM RECORD REFERENCE</div>
  <div class="beef-grid three">${field("System Record ID",r.recordId)}${field("School Year",r.schoolYear)}${field("Grade Level",r.gradeLevel)}</div>
  
 </div>
 <div class="beef-page">
  
  <h1 class="beef-title">CERTIFICATION AND PREFERRED DISTANCE LEARNING MODALITY/IES</h1><div class="beef-rule"></div>
  <div class="cert-box">I hereby certify that the above information given are true and correct to the best of my knowledge and I authorize the Department of Education to use my child's details to create/update his/her learner profile in the Learner Information System. The Department of Education may use the information to facilitate the conduct of its programs, projects, and services, subject to the provisions of the Data Privacy Act of 2012.</div>
  <div class="sig-grid"><div><div class="sig-line">${bval(r.parentGuardianPrintedName)}</div><div class="sig-label">SIGNATURE OVER PRINTED NAME OF PARENT/GUARDIAN</div></div><div><div class="sig-line">${bval(r.certificationDate)}</div><div class="sig-label">DATE</div></div></div>
  <div class="beef-section-title">PREFERRED DISTANCE LEARNING MODALITY/IES</div>
  <div class="bform-note">Choose all that applies.</div>
  <div class="modality-grid">${modalityRows(r)}</div>
  <div class="beef-section-title">ENROLLMENT RECORD REFERENCE</div>
  <div class="beef-grid three">${field("Record ID",r.recordId)}${field("LRN",r.lrn)}${field("Last Updated",formatTime(r.updatedAt))}</div>
 </div>`;
}
function renderSelectedPrint(){
 const id=document.getElementById("printRecordSelect").value,r=getRecords().find(x=>x.recordId===id),preview=document.getElementById("printPreview");
 if(!r){preview.innerHTML='<div class="print-empty"><strong>No record selected</strong>Select an enrollment record above to generate the three-page printable preview.</div>';return}
 preview.innerHTML=makeBEEF(r);
}
document.getElementById("printRecordSelect").addEventListener("change",renderSelectedPrint);
document.getElementById("printBEEFButton").addEventListener("click",()=>{
 const id=document.getElementById("printRecordSelect").value;
 if(!id){alert("Select an enrollment record first.");return}
 const logs=getLogs();logs.push({timestamp:new Date().toISOString(),user:currentUser(),action:"Generated / printed enrollment form",recordId:id});setLogs(logs);refreshAllDataViews();
 window.print();
});
window.addEventListener("tnhs:print-record",e=>{
 const id=e.detail?.recordId;if(!id)return;
 showPage("print");document.getElementById("printRecordSelect").value=id;renderSelectedPrint();setTimeout(()=>window.print(),100);
});


/* 13H — Activity Logs + System Settings */
function renderLogs(){
 const q=(document.getElementById("logsSearch").value||"").trim().toLowerCase(),a=document.getElementById("logsActionFilter").value;
 const rows=getLogs().slice().sort((x,y)=>new Date(y.timestamp||0)-new Date(x.timestamp||0)).filter(x=>{
  const hay=[x.action,x.recordId,x.user,x.timestamp].join(" ").toLowerCase();
  return(!q||hay.includes(q))&&(!a||x.action===a)
 });
 document.getElementById("logsCount").textContent=`${rows.length} activit${rows.length===1?"y":"ies"}`;
 document.getElementById("logsEmpty").style.display=rows.length?"none":"block";
 document.getElementById("logsTableBody").innerHTML=rows.map(x=>`<tr><td>${esc(formatTime(x.timestamp))}</td><td>${esc(x.user||"—")}</td><td><span class="activity-badge ${actionClass(x.action)}">${esc(x.action||"Activity")}</span></td><td>${esc(x.recordId||"—")}</td></tr>`).join("");
}
document.getElementById("logsSearch").addEventListener("input",renderLogs);
document.getElementById("logsActionFilter").addEventListener("change",renderLogs);
document.getElementById("refreshLogs").addEventListener("click",renderLogs);
function readRememberSetting(){const raw=localStorage.getItem("tnhsRememberSetting");return raw===null?true:raw==="true"}
function renderSettings(){const on=readRememberSetting(),toggle=document.getElementById("rememberSettingToggle");if(toggle){toggle.classList.toggle("on",on);toggle.setAttribute("aria-pressed",String(on))}const a=getAccount();const d=document.getElementById("accountDisplayName");const u=document.getElementById("accountUsername");if(d&&document.activeElement!==d)d.value=a.displayName||"";if(u&&document.activeElement!==u)u.value=a.username||""}
document.getElementById("rememberSettingToggle").addEventListener("click",()=>{const on=!readRememberSetting();localStorage.setItem("tnhsRememberSetting",String(on));rememberMe.checked=on;if(!on){localStorage.removeItem(SESSION_KEY)}renderSettings()});
document.getElementById("saveAccountSettings").addEventListener("click",()=>{const old=getAccount(),displayName=val("accountDisplayName")||old.displayName,username=val("accountUsername")||old.username,current=val("accountCurrentPassword"),next=val("accountNewPassword"),confirmPass=val("accountConfirmPassword");if(!displayName||!username){alert("Display name and username are required.");return}if(current!==old.password){alert("Current password is incorrect.");return}if(next&&next!==confirmPass){alert("New password and confirmation do not match.");return}const account={username,password:next||old.password,displayName};setAccount(account);const session=readSession();if(session){saveSession(username)}setLoggedIn(username);document.getElementById("accountCurrentPassword").value="";document.getElementById("accountNewPassword").value="";document.getElementById("accountConfirmPassword").value="";showToast("Account settings saved.")});
document.getElementById("clearPrototypeData").addEventListener("click",()=>{if(!confirm("Clear all saved enrollment records and activity logs from this browser?"))return;localStorage.removeItem(RECORDS_KEY);localStorage.removeItem(LOGS_KEY);lastSavedRecord=null;refreshAllDataViews();alert("Enrollment records and activity logs were cleared.")});

purgeExpiredTrash();const existingSession=readSession();rememberMe.checked=readRememberSetting();if(existingSession&&existingSession.username&&existingSession.username===getAccount().username){setLoggedIn(existingSession.username)}else{appShell.style.display="none";loginScreen.style.display="grid"}showStep(1);renderRecords();populatePrintRecords();renderSelectedPrint();renderLogs();renderSettings();

