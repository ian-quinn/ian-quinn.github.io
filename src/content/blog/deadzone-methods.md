---
title:  "Algorithm choices for Koopman Analysis and DMD"
pubDate:   2022-11-06
tags:
    - math
description: "dd"
---

Spectral analysis of nonlinear flows

Assume one has a linear dynamical system. n is so large that we cannot compute the eignevalues of A directly.

$$
\pmb{x}_{k+1} = \pmb{Ax}_k, \quad \pmb{x}_{k}\in\mathbb{R}^n
$$

To estimate these eigenvalues, a standard method is a *Krylov method*. One starts with a random vector $x_0$ and computes iterates of it, until one gets a collection of m vectors that span a *Krylov subspace*. To find the approximate eigenvalues and eigenvectors, one projects A onto this m-dimensional subspace, and calculate the eigenvalues and eigenvectors of the resulting low-rank operator. The projection means to represent A with linear combinations of the basis of $$\mathcal{K}_m$$ (which basis are independent)

$$
\mathcal{K}_m := span\{\pmb{x}_0,\pmb{Ax}_0,\cdots,\pmb{A}^{m-1}\pmb{x}_0\}
$$

$$
\begin{align}
\pmb{K} &= [\pmb{x}_0 \quad \pmb{Ax}_0 \quad \pmb{A}^2\pmb{x}_0 \quad \cdots \quad \pmb{A}^{m-1}\pmb{x}_0]\\
&= [\pmb{x}_0 \quad \pmb{x}_1 \quad \pmb{x}_2 \quad \cdots \quad \pmb{x}_{m-1}]
\end{align}
$$

*Arnoldi algorithm* is a type of Krylov method in which one orthonormalizes the iterates at each step, and it therefore involves computing the action of A on arbitrary vectors. Below if one variant by (Saad 1980) and (Schmid 2008)
The logic. As the number of snapshots increase the $\mathcal{K}_m$ captures the dominant features of the underlying physical process, it is reasonable to assume that, beyond a critical number of snapshots, adding further snapshots to the data sequence will not improve the $\mathcal{K}_m$. When the limit is reached, one can express the vector $\pmb{x}_m$ as a linear combination of the previous, and <u>linearly independent vectors</u>.

$$
\pmb{x}_m = \pmb{Ax}_{m-1} = 
\begin{bmatrix}
\pmb{x}_0 \quad \pmb{x}_1 \quad \pmb{x}_2 \quad \cdots \quad \pmb{x}_{m-1}
\end{bmatrix} * 
\begin{bmatrix}
c_0 \\ c_1 \\ \vdots \\ c_{m-1}
\end{bmatrix}
$$

$$
\pmb{x}_m = \pmb{Kc}
$$

Expand it to matrices

$$
\begin{align}
\pmb{AK} &= [\pmb{Ax}_0 \quad \pmb{Ax}_1 \quad \cdots \quad \pmb{Ax}_{m-1}] \\
&= [\pmb{x}_1 \quad \pmb{x}_2 \quad \cdots \quad \pmb{x}_m] \\
&= [\pmb{x}_0 \quad \pmb{x}_1 \quad \pmb{x}_2 \quad \cdots \quad \pmb{x}_{m-1}] * 
\begin{bmatrix}
0 & 0 & \cdots & 0 & c_0 \\ 
1 & 0 &  & 0 & c_1 \\ 
0 & 1 &  & 0 & c_2 \\ 
\vdots &  & \ddots & & \vdots \\
0 & 0 & \cdots & 1 & c_{m-1} \\
\end{bmatrix}
\end{align}
$$

$$
\pmb{AK} = \pmb{KC}
$$

Matrix $\pmb{C}$ is of companion type. The eigenvalues of $\pmb{C}$ then approximate <u>some</u> of the eigenvalues of $\pmb{A}$. ($\pmb{A}$ and $\pmb{C}$ are similar matrices, thus they have the same eigenvalues)

$$
\pmb{C\alpha} = \lambda \pmb{\alpha}
$$

$$
\pmb{AK\alpha} = \pmb{KC\alpha} = \pmb{K}\lambda\pmb{\alpha} = \lambda \pmb{K\alpha}
$$

It is easy to prove that $\pmb{v}=\pmb{K\alpha}$ is an eigenvector of $\pmb{A}$, with eigenvalue $\lambda$

--------------------

Now comes the real situation where the m-th interate is not a linear combination of the previous iterates, there will be a residual adding to the equation:

$$
\pmb{x}_m = \pmb{Kc} + \pmb{r}
$$

The residual should be minimized by carfully choosing $\pmb{c}$ to make that

$$
\pmb{r} \perp span\{\pmb{x}_0,\pmb{Ax}_0,\cdots,\pmb{A}^{m-1}\pmb{x}_0\}
$$

It is clearly stated in (Budisic 2012) that $\pmb{c}$ is chosen to minimize the norm of $\pmb{r}$, corresponding to choosing the right projection operator so that your new observales are the least-square approximations to the original dynamic system. This implies that if the norm of $\pmb{r}$ is sufficiently small, then in the following equation, $\pmb{C}$ is thought of as an approximation of the action of the Koopman operator on the associated finite dimensional space $\mathcal{K}_m$. (Raak, 2016)  
In this case, we can expand the relation to:

$$
\pmb{AK} = \pmb{KC} + \pmb{r}\pmb{e}^T = [\pmb{x}_0 \quad \pmb{x}_1 \quad \cdots \quad \pmb{x}_{m-1}]  
\begin{bmatrix}
0 & 0 & \cdots & 0 & c_0 \\ 
1 & 0 &  & 0 & c_1 \\ 
0 & 1 &  & 0 & c_2 \\ 
\vdots &  & \ddots & & \vdots \\
0 & 0 & \cdots & 1 & c_{m-1} \\
\end{bmatrix} + 
\begin{bmatrix}
0 \\ 0 \\ 0 \\ \vdots \\ r \\
\end{bmatrix}
$$

*Ritz values* - eigenvalues of $\pmb{C}$, are approximations to the eigenvalues of $\pmb{A}$  
*Ritz vectors* - corresponding approximate eigenvectors of $\pmb{A}$, given by $\pmb{v}=\pmb{K\alpha}$

>In the literature on DMD, the above procedure is sometimes called Arnoldi algorithm, which, in our opinion, is misplaced. In our opinion, the proper name should be Krylov-Rayleigh-Ritz procedure to point out that the procedure described here is just the Rayleigh-Ritz in a subspace defined by the Krylov basis. The Arnoldi algorithm is the method of applying the Gram-Schmidt orthogonalization (QR factorization) implicitly on the sequence of the $\pmb{x}_i$. A true Arnoldi scheme in the DMD frame work is proposed only recently in "A parallel Dynamic Mode Decomposition algorithm using
modified Full Orthogonalization Arnoldi for large sequential snapshots". Remark 7.1[^KoopmanBook]

(Note there are following variants of Arnoldi method and eventually leading the problem from Koopman Mode calculations to the degenerated verison, Dynamic Mode. The full Arnoldi method reduces it to an upper Hessenberg matrix, while the simplized arnoldi focuses on the companion matrix $\pmb{C}$ we talked above.)

1. Arnoldi. $\pmb{A}$ -> *Henssenberg*, by simple QR-decomposition of $\pmb{K}$. One <u>successively</u> orthogonormalizes the vectors of $\pmb{K}$ resulting in a decomposition of the form $\pmb{AQ}\approx\pmb{QH}$ with $\pmb{J}=\pmb{QR}$ and $\pmb{H}=\pmb{RSR}^{-1}$ as a Henssenberg matrix. Use the eigenvalues of $\pmb{H}$ to approximate some of the eigenvalues of $\pmb{A}$ (Schmid 2010)
2. Classical Arnoldi. $\pmb{A}$ -> *Henssenberg*, by a sequence of projections onto <u>successive</u> Krylov subspace*s*. This is more stable but the matrix $\pmb{A}$ has to be available. (Schmid 2010)
3. Variant Arnoldi. $\pmb{A}$ -> Companion. From observation $\pmb{c}=\pmb{K}^\dagger \pmb{x}_m$ is one solution. The dagger denotes the *Moore-Penrose* pseudoinverse. This solution is unique if and only if $\pmb{K}$ has linearly independent columns. In this case, we can use the pseudoinverse expansion $\pmb{K}^\dagger=(\pmb{K}^*\pmb{K})^{-1}\pmb{K}^*$. This is analytically correct but ill-conditioned in practice especially applied on noisy experimental data [^Chen]
4. Variant Arnoldi: *QR DMD*. $\pmb{A}$ -> Companion. Denote $\pmb{K}=\pmb{QR}$ as the economy-size QR-decomposition of the data sequence, then the last column of the companion matrix $\pmb{C}$ is $\pmb{c}=\pmb{R}^{-1}\pmb{Q}^H\pmb{x}_m$. However, in practice this could be ill-conditioned that is often not capable of extracting more than the first one or two dominant dynamic modes. (Schmid 2010)
5. Variant Arnoldi: *Standard DMD*. $\pmb{A}$ -> Companion. Introduce SVD and project $\pmb{A}$ onto a POD basis. No orthogonalization step, low algorithmic stability and convergence property, but allows 'model-free' application. (Schmid 2010)
6. Variant Arnoldi: Proney-type method or *Hankel DMD*. It uses time delays and Drylov subspaces in observable space. Its advantage is that it prevents the rank deficiency observed in the original Arnoldi-type algorithm. [^KoopmanBook]

(As the conclusion, we may get the algorithm scrapped from (Rowley 2009). However, the paper details nothing about how to get the proper constants $\pmb{c}$)
>**Input** $\pmb{x}_{k+1} = \pmb{Ax}_k, \quad \pmb{x}_{k}\in\mathbb{R}^n$  
>**Output** empirical Ritz values $\lambda_j$, empirical Ritz vectors $\pmb{v}_j$
>1. Define $\pmb{K} = [\pmb{x}_0 \quad \pmb{Ax}_0 \quad \cdots \quad \pmb{A}^{m-1}\pmb{x}_0]$ 
>2. Find constants $\pmb{c}$ such that  
>$$\pmb{r}=\pmb{x}_m-\pmb{Kc}$$  
>$$\pmb{r}\perp span\{\pmb{x}_0,\pmb{Ax}_0,\cdots,\pmb{A}^{m-1}\pmb{x}_0\}$$
>3. Define companion matrix:  
>$$ \pmb{C}=\begin{bmatrix} 0 & 0 & \cdots & 0 & c_0 \\ 1 & 0 &  & 0 & c_1 \\ 0 & 1 &  & 0 & c_2 \\ \vdots &  & \ddots & & \vdots \\ 0 & 0 & \cdots & 1 & c_{m-1} \\ \end{bmatrix} $$
>4. Find its eigenvalues and eigenvectors by $\pmb{C}=\pmb{T}^{-1}\pmb{\Lambda T}$
>5. empirical Ritz values are diagonal values of $\pmb{\Lambda}$
>6. empirical Ritz vectors are columns of $\pmb{V}=\pmb{KT}^{-1}$


But, how to understand these values?  
If the linear relationship holds, these empirical Ritz values are the usual Ritz values of $\pmb{A}$ after m steps of the Arnoldi method. And, the Ritz values and vectors are good approximations of the eigenvalues and eigenvectos of $\pmb{A}$.  
If not hold, it produces nothing but approximations of the *Koopman modes* and associated eigenvalues. Why is that?

------------------

In step-6 we defined that $\pmb{V}=\pmb{KT}^{-1}$ and through a basic transformation we get:
$$
\pmb{K} = \pmb{VT} = [\pmb{v}_1 \quad \cdots \quad \pmb{v}_m] * \begin{bmatrix}
1 & \lambda_1 & \lambda^2_1 & \cdots & \lambda^{m-1}_1 \\
1 & \lambda_2 & \lambda^2_2 & \cdots & \lambda^{m-1}_2 \\
\vdots & \vdots & \vdots & \ddots & \vdots \\
1 & \lambda_m & \lambda^2_m & \cdots & \lambda^{m-1}_m \\
\end{bmatrix}
$$
$$
\begin{align}
\pmb{AK}&=\pmb{KC}+\pmb{r} = \pmb{KT}^{-1}\pmb{\Lambda T}+\pmb{r} = \pmb{V\Lambda T}+\pmb{r} \\
&=[\pmb{v}_1 \quad \cdots \quad \pmb{v}_m]
\begin{bmatrix}
\lambda_1 &   &   &  \\
 & \lambda_2 & & \\
 & & \ddots & \\
 & & & \lambda_{m} \\
\end{bmatrix}
\begin{bmatrix}
1 & \lambda_1 & \lambda^2_1 & \cdots & \lambda^{m-1}_1 \\
1 & \lambda_2 & \lambda^2_2 & \cdots & \lambda^{m-1}_2 \\
\vdots & \vdots & \vdots & \ddots & \vdots \\
1 & \lambda_m & \lambda^2_m & \cdots & \lambda^{m-1}_m \\
\end{bmatrix} + 
\begin{bmatrix}
0 \\
0 \\
\vdots \\
r \\
\end{bmatrix}
\end{align}
$$
Remember that $\pmb{K} = [\pmb{x}_0 \quad \pmb{x}_1 \quad \cdots \quad \pmb{x}_{m-1}]$ and observed from the equations above we have
$$
\pmb{x}_k = \sum^m_{j=1}{\lambda^k_j\pmb{v}_j}, \quad k = 0,\cdots,m-1
$$
$$
\pmb{x}_m = \sum^m_{j=1}{\lambda^k_j\pmb{v}_j} + \pmb{r}, \quad \pmb{r}\perp span\{\pmb{x}_0,\pmb{x}_1,\cdots,\pmb{x}_{m-1}\}
$$



-----------------

The spatial & temporal attributes

*space << time*, n << m. The rank of $\pmb{K}$ is at most n, that is, the rank-deficiency is inevitable when computing $\pmb{c}$, which implies no uniqueness of $\pmb{c}$. (It if unique when and only when $\pmb{K}$ has linear independent columns, i.e., full-ranked)

*space >> time*, n >> m. Especially in fluid mechanics, $\pmb{K}$ may have a row dimension over $\mathcal{O}(10^5\sim 10^{10})$ and a column dimension at $\mathcal{O}(10^1\sim 10^3)$. In this case, $\pmb{K}^*\pmb{K}$ is much smaller than $\pmb{K}$. So the DMD method by Schmid is much more efficient for less memory cost. (This is another kind of rank-deficiency where you truncate the space dimensions more essily with SVD) [^Chen] (The DMD is more suitable for local short-time dynamics. Chen calls it as "snapshots approach")
The tacit assumption in a DMD analysis is that m<<n, that the number of snapshots m is much smaller than the ambient space dimension n. In other words, the action of $\mathbb{A}$ is empirically known only in a small-dimensional subspace of its domain, $\mathbb{R}_n$. [^KoopmanBook] P163

Examples:  
*28 × 241* Arnoldi for the KMD of conditioned room air temperature (Hiramatsu 2020)  
*20 × 24~120* *141× 48~132* Arnoldi vs. DMD wind power farm (Raak 2016)  
*7 × 24~240* Arnoldi vs. DMD power system (Raak 2016)  
*1024^2 × 150~250* DMD on high-speed flame images (Ghosal 2016)  
*256 × 201 × 144 ~ 251* Arnoldi-like DMD on horse-shoe turbulence (Rowley 2009)

---------------------------

Tips  
The eigenvalues of the following offset diagonal matrix, are the <u>n-th roots of unity</u>, $\lambda_j=e^{2\pi ij/n}$, because you will always get $\lambda^n=1$ solving the matrix.
$$
\begin{bmatrix}
0 & 0 & \cdots & 0 & 1 \\
1 & 0 & \cdots & 0 & 0 \\
0 & 1 & \cdots & 0 & 0 \\
\vdots & \vdots & \ddots & \vdots & \vdots \\
0 & 0 & \cdots & 1 & 0 \\
\end{bmatrix}
$$

**SVD**
![[SVD.jpg | 500 ]]
```matlab
[U,S,V] = svd(A)
[U,S,V] = svd(A,"econ")
```
1. Full SVD
2. Thin/economy-sized SVD (remove columns of U not corresponding to rows of V*)
3. Compact SVD (truncate to singular values)
4. Truncated SVD (truncate to the largest singular value)

*QR decomposition*
Q - an orthogonal ($Q^T=Q^{-1}$) or unitary matrix ($Q^*=Q^{-1}$)
R - an upper triangular matrix
The decomposition follows the Gram-Schmidt process. If we presume that $\pmb{A}=\pmb{QR}$ there will be:
$$
(\pmb{v}_1, \pmb{v}_2, \cdots, \pmb{v}_k)=(\pmb{e}_1, \pmb{e}_2, \cdots, \pmb{e}_k) * 
\begin{bmatrix}
\Vert \pmb{u}_1 \Vert & proj_{\pmb{u}_1}(\pmb{v}_2) & \cdots & proj_{\pmb{u}_1}(\pmb{v}_k) \\
0 & \Vert \pmb{u}_2 \Vert & \cdots & proj_{\pmb{u}_2}(\pmb{v}_k) \\
\vdots & \vdots & \ddots & \vdots \\
0 & 0 & \cdots & proj_{\pmb{u}_{k-1}}(\pmb{v}_k) \\
0 & 0 & \cdots & \Vert \pmb{u}_k \Vert \\
\end{bmatrix}
$$


----------------------
Reference

[^KoopmanBook]: The Koopman operator in systems and control: Concepts, methodologies, and applications. Springer. 2020
[^DMDBook]: Dynamic mode decomposisiton: Data-driven modeling of complex systems. SIAM. 2016
[^Anantharamu]: A parallel Dynamic Mode Decomposition algorithm using modified Full Orthogonalization Arnoldi for large sequential snapshots. ArXiv e-prints. 2018
[^Chen]: Variants of Dynamic Mode Decomposition: Boundary Condition, Koopman, and Fourier Analyses. J Nonlinear Sci. 2012.
[^Susuki]: Y. Susuki, I. Mezic, Nonlinear Koopman modes of coupled swing dynamics and coherency identification, in: Power and Energy Society General Meeting, 2010 IEEE, 2010, pp. 1–8.
[^Rowley]: C. Rowley, I. Mezic, S. Bagheri, P. Schlatter, D. Henningson, Spectral analysis of nonlinear flows, Journal of Fluid Mechanics 641 (2009) 115–127.
[^Mezic]: I. Mezic, Spectral properties of dynamical systems, model reduction and decompositions., Nonlinear Dynamics 41 (2005) 309–325.

