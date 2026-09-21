"""Independent exact checks of the authored numerical practice data.

Requires SymPy. Does not call a grading service or modify personal answers.
The canonical inputs are declarative fixtures and published questions. This checker
uses rational matrices, ranks, null spaces, eigenvalues, and normal equations
independently of the TypeScript and Go grading implementations.
"""
import json
import re
from pathlib import Path
from sympy import Matrix, Rational, eye, simplify, acos, pi

ROOT = Path(__file__).resolve().parents[2]
def scalar(x):
    return Rational(str(x))
def mat(a):
    return Matrix([[scalar(x) for x in row] for row in a])
def vec(a):
    return Matrix([scalar(x) for x in a])
def same(a, b):
    assert a.shape == b.shape, (a.shape, b.shape)
    assert all(simplify(x-y) == 0 for x, y in zip(a,b)), (a,b)
fixtures = json.loads((ROOT/'content/linear-algebra-verification.json').read_text(encoding='utf-8'))
notebook = json.loads((ROOT/'output/content/notebook.json').read_text(encoding='utf-8'))
questions = {(l['slug'], q['id']): q for l in notebook['lessons'] for q in l['questions']}
def plain(s):
    return re.sub(r'\[([^\]]+)\]\(ref:[^)]+\)',r'\1',s)
for f in fixtures:
    try:
        displayed=questions[(f['lesson'],f['id'])]
        assert plain(displayed['prompt'])==f['prompt'], 'Displayed prompt differs from verified data'
        assert plain(displayed['answer'])==f['answer'], 'Displayed answer differs from verified data'
        kind=f['kind']
        if kind=='difference': same(vec(f['b'])-vec(f['a']),vec(f['expected']))
        elif kind=='combination': same(Matrix.hstack(*(vec(v) for v in f['vectors']))*vec(f['coefficients']),vec(f['expected']))
        elif kind=='span-pair':
            u=vec(f['u']); assert Matrix.hstack(u,vec(f['yes'])).rank()==u.rank()
            assert Matrix.hstack(u,vec(f['no'])).rank()>u.rank()
        elif kind=='dot': assert vec(f['a']).dot(vec(f['b']))==scalar(f['expected'])
        elif kind=='normalize':
            a=vec(f['a']); assert a.norm()==scalar(f['norm']); same(a/a.norm(),vec(f['expected']))
            assert vec(f['expected']).norm()==1
        elif kind=='squared-distance': assert (vec(f['b'])-vec(f['a'])).dot(vec(f['b'])-vec(f['a']))==scalar(f['expected'])
        elif kind in ('angle','cosine'):
            a,b=vec(f['a']),vec(f['b']); c=simplify(a.dot(b)/(a.norm()*b.norm()))
            assert simplify((acos(c)*180/pi if kind=='angle' else c)-scalar(f['expected']))==0
        elif kind=='transpose': same(mat(f['a']).T,mat(f['expected']))
        elif kind=='matrix-combination': same(2*mat(f['a'])-mat(f['b']),mat(f['expected']))
        elif kind=='mv': same(mat(f['a'])*vec(f['x']),vec(f['expected']))
        elif kind=='mm': same(mat(f['a'])*mat(f['b']),mat(f['expected']))
        elif kind=='two-products':
            a,b=mat(f['a']),mat(f['b']); same(a*b,mat(f['ab']));same(b*a,mat(f['ba']))
        elif kind=='unique-system':
            a,b=mat(f['a']),vec(f['b']); assert a.rank()==a.cols; same(a.inv()*b,vec(f['expected']))
        elif kind=='classification':
            a,b=mat(f['a']),vec(f['b']); assert (a.rank()==a.row_join(b).rank())==f['consistent']
        elif kind=='affine-family':
            a,b=mat(f['a']),vec(f['b']); same(a*vec(f['particular']),b)
            z=Matrix.hstack(*(vec(v) for v in f['directions']));same(a*z,Matrix.zeros(a.rows,z.cols))
            assert z.rank()==z.cols==a.cols-a.rank()
        elif kind=='spaces':
            a=mat(f['a']); cb=Matrix.hstack(*(vec(x) for x in f['columnBasis']));nb=Matrix.hstack(*(vec(x) for x in f['nullBasis']))
            assert a.rank()==f['rank']==cb.rank()==cb.cols
            assert a.row_join(cb).rank()==a.rank()
            same(a*nb,Matrix.zeros(a.rows,nb.cols));assert nb.rank()==nb.cols==a.cols-a.rank()
        elif kind=='inverse':
            a=mat(f['a']);assert a.det()==scalar(f['det']);same(a.inv(),mat(f['expected']))
        elif kind=='determinant': assert mat(f['a']).det()==scalar(f['expected'])
        elif kind=='similarity': same(mat(f['p']).inv()*mat(f['a'])*mat(f['p']),mat(f['expected']))
        elif kind=='projection':
            u,b=vec(f['u']),vec(f['b']);p=u*(u.dot(b)/u.dot(u));same(p,vec(f['expected']));same(b-p,vec(f['residual']));assert u.dot(b-p)==0
        elif kind=='projection-space':
            a,b=mat(f['a']),vec(f['b']);same(a*(a.T*a).inv()*a.T*b,vec(f['expected']))
        elif kind=='gram-schmidt':
            retained=[]
            for raw,expected in zip(f['a'],f['remainders']):
                w=vec(raw)
                for u in retained:w-=u*(u.dot(vec(raw))/u.dot(u))
                same(w,vec(expected));assert w.norm()!=0;retained.append(w)
        elif kind=='least-squares':
            a,b,x=mat(f['a']),vec(f['b']),vec(f['x']);same(a*x,vec(f['expected']));same(a.T*(b-a*x),Matrix.zeros(a.cols,1))
        elif kind=='diagonal-eigen':
            a=mat(f['a']);vals=[]
            for value,count in a.eigenvals().items():vals.extend([value]*count)
            assert sorted(vals)==sorted(f['values'])
        elif kind=='eigen':
            a=mat(f['a']); p=Matrix.hstack(*(vec(x) for x in f['vectors'])); assert p.rank()==a.cols
            for value,v in zip(f['values'],f['vectors']):same(a*vec(v),scalar(value)*vec(v))
        elif kind=='multiplicity':
            a=mat(f['a']);assert a.eigenvals()=={scalar(f['value']):2};assert a.cols-(a-scalar(f['value'])*eye(a.rows)).rank()==f['geometric']
        elif kind=='svd':
            a,u,s,v=map(lambda k:mat(f[k]),['a','u','sigma','v']);same(u.T*u,eye(u.cols));same(v.T*v,eye(v.cols));same(u*s*v.T,a)
            assert all(s[i,j]==0 for i in range(s.rows) for j in range(s.cols) if i!=j)
            vals=list(s.diagonal());assert all(x>=0 for x in vals) and vals==sorted(vals,reverse=True)
        elif kind=='rank-spectrum':
            a=mat(f['a']);assert a.rank()==f['rank'];vals=[]
            for value,count in (a.T*a).eigenvals().items():vals.extend([value]*count)
            assert sorted(vals)==sorted(f['ataEigen'])
        elif kind=='singular-direction':
            a,r,l=mat(f['a']),vec(f['right']),vec(f['left']);assert r.norm()==l.norm()==1;same(a*r,scalar(f['sigma'])*l);same(a.T*l,scalar(f['sigma'])*r)
        elif kind=='truncation': assert sum(scalar(x)**2 for x in f['values'][f['k']:])==scalar(f['errorSquared'])
        else:raise AssertionError('Unknown fixture kind '+kind)
    except Exception as e:
        raise AssertionError(f"{f['lesson']}/{f['id']}: {kind}: {e}") from e
print(f'Independently verified {len(fixtures)} exact numerical exercises with SymPy.')
