"""Source-pinned linear algebra assessments; regenerate after the LA worksheet author.

Numerical families use the author's emitted verification data. Exact Fraction
arithmetic below independently checks computations before publishing metadata.
No generated worksheet or numeric family parameter is copied by hand.
"""
from fractions import Fraction as F
from hashlib import sha256
from pathlib import Path
from copy import deepcopy
import json, re
ROOT=Path(__file__).resolve().parents[2]
AUDIT={r['key']:r for r in json.loads((ROOT/'docs/deterministic-grading-audit.json').read_text())['exercises'] if r['key'].startswith('linear-algebra-')}
VERIFY=json.loads((ROOT/'content/linear-algebra-verification.json').read_text())
EXISTING={f"{e['lesson']}-{e['id']}" for e in json.loads((ROOT/'content/deterministic-exercises.json').read_text())}
ENTRIES={}; NOTES={}
def canon(lesson):return lesson.replace('rank-inverses','bases').replace('least-squares','projections')
def keyof(v):return canon(v['lesson'])+'-'+str(v['id'])
def s(x):return str(F(str(x)))
def vs(v):return [s(x) for x in v]
def ms(a):return [vs(r) for r in a]
def vec(v):return '('+', '.join(map(str,v))+')'
def mat(a):return '; '.join(', '.join(map(str,r)) for r in a) if a else '{}'
def dot(a,b):return sum(F(str(x))*F(str(y)) for x,y in zip(a,b))
def tr(a):return list(map(list,zip(*a)))
def mv(a,x):return [dot(r,x) for r in a]
def mm(a,b):return [[dot(r,c) for c in tr(b)] for r in a]
def add(a,b):return [F(str(x))+F(str(y)) for x,y in zip(a,b)]
def scale(c,a):return [F(str(c))*F(str(x)) for x in a]
def identity(n):return [[int(i==j) for j in range(n)] for i in range(n)]
def rref(a):
 a=[[F(str(v)) for v in r] for r in a]; piv=[]; i=0
 for j in range(len(a[0])):
  k=next((k for k in range(i,len(a)) if a[k][j]),None)
  if k is None:continue
  a[i],a[k]=a[k],a[i]; a[i]=scale(1/a[i][j],a[i])
  for k in range(len(a)):
   if k!=i:a[k]=add(a[k],scale(-a[k][j],a[i]))
  piv.append(j);i+=1
  if i==len(a):break
 return a,piv

def null(a):
 r,p=rref(a); n=len(a[0]); out=[]
 for j in range(n):
  if j in p:continue
  x=[F(0)]*n;x[j]=F(1)
  for i,k in enumerate(p):x[k]=-r[i][j]
  out.append(x)
 return out

def particular(a,b):
 r,p=rref([row+[b[i]] for i,row in enumerate(a)]);n=len(a[0]);x=[F(0)]*n
 assert n not in p
 for i,j in enumerate(p):x[j]=r[i][-1]
 return x

class Task:
 def __init__(self,key):
  assert key in AUDIT and key not in ENTRIES and key not in EXISTING,key
  self.key=key;self.q=AUDIT[key]['publishedQuestion'];self.inputs=[];self.reqs=[];self.response={};self.wrong={};self.alt={};self.shift=False;self.note='';self.prompt=None
 def field(self,label,validator,params,value,wrong,alt=None,kind='math'):
  i='answer-'+str(len(self.inputs)+1);self.inputs.append({'id':i,'kind':kind,'label':label});self.reqs.append({'id':i,'description':label+' is correct.','validator':validator,'fields':[i],'params':params});self.response[i]=value;self.wrong[i]=wrong
  if alt is not None:self.alt[i]=alt
  return i
 def num(self,label,value):
  value=str(value);return self.field(label,'exact',{'expected':[value]},value,'('+value+')+1','2*('+value+')/2')
 def tuple(self,label,value,ordered=True):
  value=list(map(str,value));wrong=value[:];wrong[0]='('+wrong[0]+')+1'
  return self.field(label,'tuple',{'expected':value,'ordered':ordered},vec(value),vec(wrong),vec(['2*('+x+')/2' for x in value]))
 def matrix(self,label,value):
  value=ms(value);wrong=deepcopy(value);wrong[0][0]='('+wrong[0][0]+')+1'
  return self.field(label,'matrix',{'expected':value},mat(value),mat(wrong),mat([['2*('+x+')/2' for x in r] for r in value]))
 def boolean(self,label,value):return self.field(label,'boolean',{'expected':[value]},value,not value,kind='boolean')
 def select(self,label,correct,*wrong,shift=True):
  i='answer-'+str(len(self.inputs)+1); options=[{'id':f'option-{n+1}','label':v} for n,v in enumerate([correct,*wrong])]
  # Stable rotation prevents a published first-answer pattern.
  n=int(self.key.rsplit('-',1)[1])%len(options);options=options[n:]+options[:n]
  self.inputs.append({'id':i,'kind':'select','label':label,'options':options});self.reqs.append({'id':i,'description':label+' is correct.','validator':'selection','fields':[i],'params':{'expected':['option-1']}});self.response[i]='option-1';self.wrong[i]='option-2';self.shift|=shift;return i
 def linear(self,label,params,value,wrong,alt=None):return self.field(label,'linear',params,value,wrong,alt)
 def basis(self,label,a,space,original=False):
  r,p=rref(a);value=null(a) if space=='null' else [tr(a)[j] for j in p] if space=='column' else r[:len(p)]
  params={'kind':'basis','a':ms(a),'space':space}
  if original:params['originalColumns']=True
  alt=list(reversed(value)) if original else [scale(-2,r) for r in reversed(value)]
  return self.linear(label+' (one vector per row; {} for the empty basis)',params,mat(ms(value)),mat([[0]*len(value[0])]) if value else '1',mat(ms(alt)))
 def affine(self,a,b):
  p=particular(a,b);d=null(a);i=self.field('Particular solution','tuple',{'expected':vs(p)},vec(vs(p)),vec(vs(add(p,[1]+[0]*(len(p)-1)))));j=self.field('Homogeneous directions (one vector per row; {} if none)','matrix',{'expected':[['0']]},mat(ms(d)),mat([[0]*len(p)]));self.reqs=self.reqs[:-2]+[{'id':'family','description':'The complete affine solution family is correct.','validator':'linear','fields':[i,j],'params':{'kind':'affine-family','a':ms(a),'b':vs(b)}}]
  self.alt[i]=vec(vs(add(p,d[0]))) if d else vec(vs(p));self.alt[j]=mat(ms([scale(-2,x) for x in reversed(d)]))
 def witness(self,labels,values,conditions,integer=False,alternate=None):
  fields=[];variables=[]
  for name,label,value in zip('abcdefghijklmnpqrstuvwxyz',labels,values):
   i='answer-'+str(len(self.inputs)+1);self.inputs.append({'id':i,'kind':'math','label':label});self.response[i]=str(value);self.wrong[i]='0';variables.append({'name':name,'field':i,'integer':integer});fields.append(i)
  self.reqs.append({'id':'witness-'+fields[0],'description':'The values satisfy every requested condition.','validator':'witness','fields':fields,'params':{'variables':variables,'conditions':[{'left':l,'op':o,'right':r} for l,o,r in conditions]}})
  if alternate:
   for i,v in zip(fields,alternate):self.alt[i]=str(v)
  return fields
 def finish(self,note='',prompt=None):
  original=[self.q['instructions'],self.q['prompt'],self.q.get('math'),self.q['officialAnswer']]
  digest=sha256(json.dumps(original,ensure_ascii=False,separators=(',',':')).encode()).hexdigest();lesson,id=self.key.rsplit('-',1)
  fixtures=[{'response':self.response,'verdict':'correct'}]
  if self.alt:fixtures.append({'response':{**self.response,**self.alt},'verdict':'correct'})
  # Reject a single independently altered required answer; witness fields use all-zero rejection.
  first=next(iter(self.response));bad={**self.response,first:self.wrong[first]}
  if any(r['validator']=='witness' and first in r['fields'] for r in self.reqs):bad={**self.response,**self.wrong}
  fixtures.extend([{'response':bad,'verdict':'incorrect'},{'response':{k:v for k,v in self.response.items() if k!=first},'error':True}])
  evidence='recognition' if all(x['kind'] in ['select','boolean'] for x in self.inputs) else 'production'
  a={'version':1,'inputs':self.inputs,'requirements':self.reqs,'feedback':{'correct':self.q['officialAnswer'],'incorrect':'Check each requested result and the selected reason.'},'evidence':{'level':evidence,'interactionCost':'medium' if len(self.inputs)>3 else 'low','inputCapabilities':list(dict.fromkeys('tap' if i['kind'] in ['select','boolean'] else 'math-text' for i in self.inputs))}}
  e={'lesson':lesson,'id':int(id),'sourceHash':digest,'rationale':note or 'The requested outputs are finite and exact; equivalent numerical forms and nonunique constructions are checked mathematically.','assessment':a,'fixtures':fixtures}
  if self.shift or prompt:
   e['prompt']=prompt or self.q['prompt']+' Enter the requested values and select the matching reason below.'
   e['instructions']='Complete the answer fields.'
  ENTRIES[self.key]=e;NOTES[self.key]={'evidenceChange':'Short explanation becomes reason recognition; numerical or construction outputs remain production.' if self.shift else 'Production preserved.','source':'docs/deterministic-linear-source-inspection.md','batch':'linear-algebra-exact','promptChange':e.get('prompt','')!=self.q['prompt']}

# Finite generated families, evaluated from the common authoring parameters.
for v in VERIFY:
 key=keyof(v)
 if key in EXISTING:continue
 family=canon(v['lesson']).removeprefix('linear-algebra-');n=v['id'];k=v['kind'];t=Task(key)
 if k=='difference':
  d=add(v['b'],scale(-1,v['a']));assert vs(d)==vs(v['expected']);t.tuple('Displacement',d);t.tuple('Displacement after translating both endpoints',d)
 elif family=='vectors' and k=='combination':
  if 41<=n<=46:continue # Explicit derivation of coefficients is the assessed work.
  out=[sum(F(str(c))*F(str(vv[j])) for c,vv in zip(v['coefficients'],v['vectors'])) for j in range(len(v['vectors'][0]))];assert vs(out)==vs(v['expected'])
  t.tuple('Result',out)
  if 17<=n<=22:t.tuple('Result after adding 2v',scale(3,v['vectors'][0]))
  elif 23<=n<=28:t.select('Why is the recovered vector unique?','Each coordinate is fixed by subtracting the known vector from the target.','Any vector of the same length gives the same sum.','The components can be freely reordered.')
  elif 59<=n<=64:
   t.tuple('Total including startup use',add(out,[2,4]));t.select('Is the complete rule proportional?','No: the fixed nonzero startup use remains even at zero production.','Yes: a fixed startup cost scales with every production count.','Yes: adding vectors always describes a proportional rule.')
  elif 65<=n<=70:t.select('Must this average be an observed record?','No: an average combines coordinates and need not match any observation.','Yes: averaging always selects one observed record.','Yes: equal weights force the two observations to coincide.')
 elif k=='span-pair':
  j=next(j for j,x in enumerate(v['u']) if x);c=F(v['yes'][j],v['u'][j]);t.num('Scalar reaching the first target',c);t.select('Which targets are reachable?','Only the first: one common scalar must match every component.','Both: a separate scalar may be chosen for each component.','Neither: scalar multiples cannot change vector length.')
 elif k=='dot' and family=='dot-products':
  assert dot(v['a'],v['b'])==F(v['expected'])
  if 9<=n<=14:continue # Two explicitly requested calculation methods.
  if 37<=n<=42:
   a,b=v['a'];t.witness(['First component of a nonzero perpendicular vector','Second component'],[-b,a],[('('+str(a)+')*a+('+str(b)+')*b','=','0'),('a*a+b*b','>','0')],alternate=[-2*b,2*a])
  else:
   if 3<=n<=8:t.tuple('Component products',[F(x)*F(y) for x,y in zip(v['a'],v['b'])])
   t.num('Dot product' if n<57 else 'Total cost',v['expected']);t.select('Interpretation','A scalar sum of products of matching components.','A vector containing the separate component products.','The product of the two sums of components.')
 elif k=='normalize':
  assert dot(v['a'],v['a'])==v['norm']**2;t.num('Norm',v['norm']);t.tuple('Unit vector in the given direction',vs(scale(F(1,v['norm']),v['a'])));t.num('Squared norm of the unit vector',1)
 elif k=='squared-distance':
  d=add(v['b'],scale(-1,v['a']));sq=dot(d,d);assert sq==v['expected'];t.num('Exact distance',f'sqrt({sq})');t.select('Why is subtraction order irrelevant?','Reversing subtraction negates every component, leaving its square unchanged.','Reversing subtraction leaves each component unchanged.','The distance is the sum of the signed components.')
 elif k=='angle':
  t.num('Angle in degrees',v['expected']);correct='Same direction' if v['expected']==0 else 'Opposite directions' if v['expected']==180 else 'Perpendicular' if v['expected']==90 else 'Neither parallel nor perpendicular';t.select('Direction classification',correct,*[x for x in ['Same direction','Opposite directions','Perpendicular','Neither parallel nor perpendicular'] if x!=correct],shift=False)
 elif k=='cosine':
  t.num('Cosine similarity',v['expected']);t.select('Effect of the nonzero scale factor','Its sign determines direction; its magnitude cancels from the ratio.','Both sign and magnitude cancel, so the ratio is always positive.','The ratio equals the scale factor, including its magnitude.')
 elif k=='matrix-combination':
  out=[add(scale(2,a),scale(-1,b)) for a,b in zip(v['a'],v['b'])];assert ms(out)==ms(v['expected']);t.matrix('2A − B',out);t.select('Required shape condition','The matrices must have the same number of rows and columns.','Only the inner dimensions must agree.','The matrices must both be square.')
 elif k=='mv':
  out=mv(v['a'],v['x']);assert vs(out)==vs(v['expected'])
  if family=='systems':t.matrix('Augmented matrix',[r+[out[i]] for i,r in enumerate(v['a'])]);t.tuple('Result of substituting the proposed vector',out);t.boolean('The proposed vector solves every equation',True)
  elif family=='transformations':t.matrix('Matrix of the transformation',v['a']);t.tuple('Output vector',out)
  else:
   t.tuple('Output vector',out);t.select('Column interpretation','The input entries weight the corresponding columns, which are then added.','Each input entry multiplies a whole row to form the output vector.','The output is a single column regardless of the input.' )
 elif k=='mm':
  out=mm(v['a'],v['b']);assert ms(out)==ms(v['expected'])
  if 51<=n<=56:
   for j,c in enumerate(tr(v['b'])):t.tuple(f'B applied to standard input {j+1}',c);t.tuple(f'A applied to that output {j+1}',mv(v['a'],c))
   t.select('Why do these tests suffice?','The standard inputs form a basis; linearity determines all other outputs.','Every matrix has the same outputs on these inputs.','Agreement on any one input proves matrices equal.')
  else:t.matrix('AB',out);t.tuple('Shape of AB (rows, columns)',[len(out),len(out[0])]);t.select('Which matrix acts first?','B','A',shift=False)
 elif k=='two-products':
  assert ms(mm(v['a'],v['b']))==ms(v['ab']) and ms(mm(v['b'],v['a']))==ms(v['ba']);t.matrix('AB',v['ab']);t.matrix('BA',v['ba']);t.select('Order of stretching and shearing','AB stretches inputs before the shear; BA stretches outputs after the shear.','AB shears first; BA stretches first.','Both products perform identical operations in identical order.')
 elif k=='unique-system':
  if family=='systems' and n<=22:continue
  assert vs(mv(v['a'],v['expected']))==vs(v['b']);t.tuple('Solution',v['expected']);t.tuple('Check: A times the solution',v['b'])
  if family=='systems':t.select('Why is a row swap allowed?','It reorders whole equations while providing a nonzero first pivot.','It changes the variables so a zero coefficient becomes nonzero.','It discards the equation with a zero first coefficient.')
 elif k=='spaces':
  if family=='bases' and n>=29:continue # Explicit reduction retained in first batch.
  t.basis('Column-space basis' if family=='bases' else 'Image basis',v['a'],'column');t.basis('Null-space basis' if family=='bases' else 'Kernel basis',v['a'],'null')
  if family=='bases':t.num('Column-space dimension',v['rank']);t.num('Null-space dimension',len(v['a'][0])-v['rank'])
  else:t.boolean('Injective',v['rank']==len(v['a'][0]));t.boolean('Surjective onto the stated codomain',v['rank']==len(v['a']))
 elif k=='inverse':
  assert ms(mm(v['a'],v['expected']))==ms(identity(len(v['a'])));t.matrix('Inverse',v['expected']);t.num('Determinant',v['det']);t.matrix('Check: A times the inverse',identity(len(v['a'])))
 elif k=='determinant':
  a=v['a'];d=a[0][0]*a[1][1]-a[0][1]*a[1][0];assert d==v['expected'];t.num('Determinant',d);t.num('Parallelogram area',abs(d));t.boolean('Invertible',d!=0)
 elif k=='similarity':
  p=v['p']; inv=[[F(1,2),F(1,2)],[F(1,2),F(-1,2)]];assert ms(mm(mm(inv,v['a']),p))==ms(v['expected']);t.matrix('Matrix in the specified basis',v['expected'])
 elif k=='projection':
  c=dot(v['b'],v['u'])/dot(v['u'],v['u']);out=scale(c,v['u']);res=add(v['b'],scale(-1,out));assert vs(out)==vs(v['expected']) and vs(res)==vs(v['residual'])
  if n<=8:t.num('Projection coefficient',c);t.tuple('Projection',out);t.tuple('Residual',res);t.num('Residual dot the line direction',dot(res,v['u']))
  else:t.tuple('Projection using the supplied direction',out);t.tuple('Projection using (1,1)',out);t.select('Why do the projections agree?','A nonzero rescaling leaves the spanned line unchanged.','The projection coefficient is unchanged under every rescaling.','Every target projects to itself on this line.')
 elif k=='projection-space':
  coeff=mv(tr(v['a']),v['b']);out=mv(v['a'],coeff);assert vs(out)==vs(v['expected']);t.tuple('Q transpose b',coeff);t.tuple('Projection',out);t.tuple('Residual',add(v['b'],scale(-1,out)))
 elif k=='least-squares':
  if 31<=n<=42:continue # Explicit derivation/setup of equations and solution method.
  out=mv(v['a'],v['x']);assert vs(out)==vs(v['expected']);res=add(v['b'],scale(-1,out));assert not any(mv(tr(v['a']),res))
  if 43<=n<=48:t.affine(mm(tr(v['a']),v['a']),mv(tr(v['a']),v['b']));t.tuple('Unique fitted output',out)
  else:t.tuple('Residual',res);t.tuple('A transpose times the residual',mv(tr(v['a']),res));t.select('Why does this certify a least-squares fit?','The residual is perpendicular to every column of A.','The residual must itself be zero for every best fit.','The coefficient must have the smallest possible magnitude.')
 elif k=='diagonal-eigen':
  for j,x in enumerate(v['values']):t.num(f'Eigenvalue for standard vector {j+1}',x)
  t.field('Eigenvalue for (1,1), or none','term',{'accepted':['none','not an eigenvector']},'none','0',kind='text')
 elif k=='multiplicity':t.num('Eigenvalue',v['value']);t.num('Algebraic multiplicity',2);t.num('Eigenspace dimension',v['geometric']);t.boolean('Diagonalizable',v['geometric']==2)
 elif k=='eigen':
  if n<37:continue # Characteristic-equation / eigenspace verification checkpoints pending.
  # Here the supplied P,D determine A; the task requests direct eigenvector checks.
  a=v['a'];t.matrix('A',a)
  for j,(value,x) in enumerate(zip(v['values'],v['vectors'])):t.tuple(f'A times eigenvector {j+1}',mv(a,x))
 elif k=='svd':
  assert ms(mm(mm(v['u'],v['sigma']),tr(v['v'])))==ms(v['a'])
  if n<23:
   x=[F(x.strip()) for x in re.findall(r'\(([^()]*)\)',v['prompt'])[-1].split(',')];t.matrix('Reconstructed A',v['a']);t.tuple('Output vector',mv(v['a'],x))
  else:
   fields=[]
   for label,name in [('U','u'),('Sigma','sigma'),('V','v')]:fields.append(t.matrix(label,v[name]))
   t.reqs=[{'id':'svd','description':'The supplied factors form a descending full SVD.','validator':'linear','fields':fields,'params':{'kind':'svd','a':ms(v['a']),'order':'descending'}}]
   t.alt={fields[0]:mat(ms([scale(-1,r) for r in v['u']])),fields[2]:mat(ms([scale(-1,r) for r in v['v']]))}
   t.select('Where are the original signs retained?','In the orthogonal factors; singular values stay nonnegative.','In negative entries on the diagonal of Sigma.','They disappear because an SVD preserves only magnitudes.')
 elif k=='rank-spectrum':t.num('Rank',v['rank']);t.num('Nullity',len(v['a'][0])-v['rank']);t.tuple('Eigenvalues of A transpose A, including multiplicity',v['ataEigen'],False)
 elif k=='singular-direction':
  assert vs(mv(v['a'],v['right']))==vs(scale(v['sigma'],v['left']));t.tuple('Left singular vector',v['left']);t.num('Its squared norm',dot(v['left'],v['left']));t.tuple('Check: A times the right singular vector',mv(v['a'],v['right']))
 elif k=='truncation':
  a=[[x if i==j else 0 for j in range(len(v['values']))] for i,x in enumerate(v['values'])];approx=deepcopy(a)
  for i in range(v['k'],len(a)):approx[i][i]=0
  sq=sum(x*x for x in v['values'][v['k']:]);assert sq==v['errorSquared'];t.linear('One best rank-at-most-one approximation',{'kind':'best-rank','a':ms(a),'rank':v['k'],'errorSquared':str(sq)},mat(approx),mat(a));t.num('Exact Frobenius error',f'sqrt({sq})');t.num('Error after keeping two directions',f'sqrt({sum(x*x for x in v["values"][2:])})')
 else:continue
 t.finish()

# Additional authored tasks are added below. Every baseline row is recorded,
# including proof/derivation tasks and the previously converted seven matrices.
def write():
 entries=sorted(ENTRIES.values(),key=lambda e:(e['lesson'],e['id']))
 (ROOT/'content/deterministic-linear.json').write_text(json.dumps(entries,ensure_ascii=False,indent=2)+'\n')
 ledger=[]
 for key,row in AUDIT.items():
  e=ENTRIES.get(key); method='deterministic' if e or key in EXISTING else 'choice' if row['category']=='existing-choice' else 'pending'
  record={'key':key,'originalHash':row['questionHash'],'finalMethod':method,'minimalOutputs':row['requirements'],'input': [i['kind'] for i in e['assessment']['inputs']] if e else row['inputFamily'],'validator':sorted(set(r['validator'] for r in e['assessment']['requirements'])) if e else [],'sourceInspection':'docs/deterministic-linear-source-inspection.md',**NOTES.get(key,{})}
  if method=='pending' and row['category'] in ['open','mixed']:
   record['finalMethod']='open';record['retainOpenReason']='The published task requires '+row['inputFamily'].replace('-',' ')+': '+row['publishedQuestion']['prompt']
  ledger.append(record)
 (ROOT/'docs/deterministic-linear-dispositions.json').write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n')
 from collections import Counter
 print(len(entries),'new assessments;',dict(Counter(x['finalMethod'] for x in ledger)))

if __name__=='__main__':write()
