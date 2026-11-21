import sys, random, collections, json
d=set(open(sys.argv[1]).read().split())
rank={}
for i,l in enumerate(open(sys.argv[2])):
    w=l.split()[0]
    if w in d and w not in rank: rank[w]=len(rank)
VULG=set('ass fag fags cunt cock dick fuck shit tits tit piss slut whore porn sexy sex anal rape nude dyke homo jizz damn hell crap butt boob boobs pee poop gay kill nazi carl ben roger butch dan ted tom jim kim sam don pat bob joe jack bill rick mike nick ray rob ron ken dave tim jean bud ann jan lou sue doc ma pa jew jews negro'.split())
V={w for w,r in rank.items() if 3<=len(w)<=5 and r<14000 and w not in VULG}
def nb(k):
    for i in range(len(k)):
        for c in 'abcdefghijklmnopqrstuvwxyz':
            if c!=k[i]:
                n=k[:i]+c+k[i+1:]
                if n in V: yield n
adj={k:list(nb(k)) for k in V}
sc=lambda w: -rank[w]
def bp(src):
    dist={src:0}; score={src:sc(src)}; par={src:None}; q=[src]
    while q:
        nq=[]
        for u in q:
            for v in adj[u]:
                s=min(score[u],sc(v))
                if v not in dist: dist[v]=dist[u]+1; score[v]=s; par[v]=u; nq.append(v)
                elif dist[v]==dist[u]+1 and s>score[v]: score[v]=s; par[v]=u
        q=nq
    return dist,score,par
def path(par,t):
    p=[]
    while t: p.append(t); t=par[t]
    return p[::-1]
random.seed(7); out=[]
for L,target in ((3,60),(4,210),(5,120)):
    ends=[k for k in V if len(k)==L and rank[k]<4000 and adj[k] and not (k.endswith('s') and k[:-1] in V) and not k.endswith('ed')]
    random.shuffle(ends); used=collections.Counter(); got=[]
    for a in ends:
        if len(got)>=target: break
        if used[a]>=2: continue
        dist,score,par=bp(a)
        c=[b for b in ends if b!=a and 3<=dist.get(b,0)<=6 and used[b]<2 and score[b]>-8000 and sum(x!=y for x,y in zip(a,b))>=min(L,3)]
        if not c: continue
        b=random.choice(c); got.append(path(par,b)); used[a]+=1; used[b]+=1
    out+=got; print(L,len(got),collections.Counter(len(p)-1 for p in got))
json.dump(out,open('ladders-en.json','w'))
for p in random.sample(out,12): print(' > '.join(p))
