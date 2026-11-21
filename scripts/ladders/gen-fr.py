import csv, sys, unicodedata, collections, random, json
def strip(w): return ''.join(c for c in unicodedata.normalize('NFD',w) if unicodedata.category(c)!='Mn')
sing=set(); okform=set(); freq=collections.Counter(); cg=collections.defaultdict(set)
for r in csv.DictReader(open(sys.argv[1]),delimiter='\t'):
    w=r['ortho']
    if not w.isalpha() or not w.islower(): continue
    if not 3<=len(w)<=5: continue
    f=max(float(r['freqfilms2'] or 0),float(r['freqlivres'] or 0))
    freq[w]+=f; cg[w].add(r['cgram'])
    iv=r['infover']
    if not (r['cgram'].startswith('VER') and iv and all(x.startswith(('ind:pas','sub:imp')) for x in iv.strip(';').split(';'))): okform.add(w)
    if r['nombre']!='p' and r['cgram'] in ('NOM','ADJ'): sing.add(w)
bad={'ONO','ABR'}
VULG=set('con cons conne cul culs bite pute putes merde nique niquer chier pine zob sexe porc pédé gode baise baiser foutre salope trou ève fusse eue more baisé baisée baisés gay man fout fous foutu fouta cul mec'.split())
words={}
for w,f in freq.items():
    if cg[w]<=bad or w in VULG or w not in okform: continue
    k=strip(w)
    if k not in words or freq[words[k]]<f: words[k]=w
print({n:sum(1 for k in words if len(k)==n and freq[words[k]]>=5) for n in (3,4,5)})
for t in ['coq','ane','mois','loup','mous','cous','coup','lois']:
    print(t, words.get(t), round(freq[words.get(t,'')],1), cg[words.get(t,'')])
PATHMIN=float(sys.argv[2]) if len(sys.argv)>2 else 3
ENDMIN=15
V=[k for k in words if freq[words[k]]>=PATHMIN]
Vs=set(V)
def nb(k):
    for i in range(len(k)):
        for c in 'abcdefghijklmnopqrstuvwxyz':
            if c!=k[i]:
                n=k[:i]+c+k[i+1:]
                if n in Vs: yield n
adj={k:list(nb(k)) for k in V}
def best_paths(src):
    # BFS layers, then widest (max of min freq) shortest path
    dist={src:0}; score={src:freq[words[src]]}; par={src:None}; q=[src]
    while q:
        nq=[]
        for u in q:
            for v in adj[u]:
                s=min(score[u],freq[words[v]])
                if v not in dist:
                    dist[v]=dist[u]+1; score[v]=s; par[v]=u; nq.append(v)
                elif dist[v]==dist[u]+1 and s>score[v]:
                    score[v]=s; par[v]=u
        q=nq
    return dist,score,par
def path(par,t):
    p=[]
    while t: p.append(words[t]); t=par[t]
    return p[::-1]

random.seed(7)
out=[]
for L,target in ((3,60),(4,220),(5,120)):
    ends=[k for k in V if len(k)==L and freq[words[k]]>=ENDMIN and words[k] in sing and adj[k]]
    random.shuffle(ends); used=collections.Counter(); got=[]
    for a in ends:
        if len(got)>=target: break
        if used[a]>=2: continue
        d,sc,par=best_paths(a)
        cands=[b for b in ends if b!=a and 3<=d.get(b,0)<=6 and used[b]<2 and sc[b]>=4 and sum(x!=y for x,y in zip(a,b))>=min(L,3)]
        if not cands: continue
        b=random.choice(cands)
        p=path(par,b); got.append(p); used[a]+=1; used[b]+=1
    out+=got
    print(L,len(got),collections.Counter(len(p)-1 for p in got))
json.dump(out,open('ladders-fr.json','w'),ensure_ascii=False)
for p in random.sample(out,15): print(' > '.join(p))
