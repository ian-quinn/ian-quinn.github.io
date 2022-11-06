---
layout: post
title:  "Location curve of Wall/Curtain/CurtainSystem"
date:   2022-11-06 12:07:42 +0800
categories: RevitAPI
---

![Revit API](https://img.shields.io/badge/Revit%20API-2022-green.svg)
![.NET](https://img.shields.io/badge/.NET-4.8-green.svg)

Today's question is, how to get the location curve of any enclosing components like basic/stacked/curtain wall and the curtain system? Imaging processing a badly modeled .rvt and we want to get the exact space boundary, for volume generation, collision detection or some routing algorithms. `get_PlanTopology()` is sweet for detecting plan circuits in a generated floorplan view. However, it applies global tolerance and may overflow through gaps (yes, it is a defective model).

To be clear, `var` declaration is not used in code snippet. Terms exclusive to Revit is written with the first letter capital.

## Basic/Stacked Wall

So, I plan to get the location curve of all enclosing components at each floor. Luckily, we have `LocationCurve` attribute. As to a Wall, it is the Location Line at its bottom face. For a Family Instance like Column, it usually lies at its central axis. It can be a Line or an Arc. The basic method to retrieve it is like: (let's say we filter all walls in the Revit document)

```csharp
// ExternalCommandData commandData
Document doc = commandData.Application.Document;

IList<Element> _eWalls = new FilteredElementCollector(doc)
    .OfClass(typeof(Wall))
    .OfCategory(BuiltInCategory.OST_Walls)
    .ToElement();
foreach (ELement e in _eWalls)
{
    Wall wall = e as Wall;
    LocationCurve lc = wall.Location as LocationCurve;
    if (lc.Curve is Line)
        // do something like add the line to your collection
    else
        List<XYZ> pts = new List<XYZ>(lc.Curve.Tessellate());
        // here I simplify it with Douglas-Peucker
        // then add the polyline to the collection instead
}
```

A minor flaw is that, the location curve lies at the bottom of the wall component. If encountered with a wall spanning multiple floors, like 1-5, I can only get the enclosing boundary at 1 floor not including all others above. Apparently, a workaround is to compare the elevation of wall and all levels: (though seems too dumb)

```csharp
// presume we have LevelId lvId, Wall wall
Level level = doc.GetElement(lvId) as Level;

Options op = wall.Document.Application.Create.NewGeometryOptions();
op.IncludeNonVisibleObjects = false;
GeometryElement ge = wall.get_Geometry(op);

double top = ge.GetBoundingBox().Max.Z;
double bottom = ge.GetBoundingBox().Min.Z;
double elev = level.Elevation;
// then check if elev lies within the span of top and bottom
```

`IncludeNonVisibleObjects` is a critical setting. Sometimes a wall is not what it looks like. A wall on the ground floor may have some component invisible or grid on the 5th floor, especially the case of curtains. As to a defective model, there are lots of nasty stuffs swept to the hidden layer.

The `GetBoundingBox()` is a shortcut. It is not gonna work when facing a wall that has multiple isolated geometry components. A typical case is the punctuated wall like this. The location curve should break at the hole, which means it must be the intersection between the floor plane and the actual geometry of walls.

![A wall with holes](/assets/punctuated_wall.png)

We need Boolean operations for solid and plane intersection. Two routes:
1. RevitAPI provides `CutWithHalfSpace()` ([API](https://www.revitapidocs.com/2022/cbde1739-3680-4f2a-8215-a48fd08dcb5c.htm) / [code_1](https://www.parametriczoo.com/index.php/2020/04/09/plane-and-solid-surface-intersection/) / [code_2](https://forums.autodesk.com/t5/revit-api-forum/intersect-solid-and-plane/td-p/6945083)). Get the intersection plane then reduce it to the location curve.
2. Extract the external face of the wall then perform the intersection with floor plane.

Note that the external face may not be the actual "external" one for this is often wrongly defined in a defective model. I prefer the 1st one by collapsing rectangles to center lines. 

```csharp
// basic method for solid-plane intersection
CurveLoop GetSolidPlaneIntersectionCurve(Plane plane, Solid solid)
{
    if (solid == null) return null;
    Solid cast = BooleanOperationsUtils.CutWithHalfSpace(solid, plane);
    if (cast == null)
    {
        // what if the plane lies exactly on the bottom face of the solid?
        // just reverse the plane and do it again
        cast = BooleanOperationsUtils.CutWithHalfSpace(solid, 
            Plane.CreateByNormalAndOrigin(-plane.Normal, plane.Origin));
        if (cast == null)
            return null;
    }
    PlanarFace cutFace = null;
    foreach (Face face in cast.Faces)
    {
        PlanarFace pf = face as PlanarFace;
        if (pf == null) continue;
        if (pf.FaceNormal.IsAlmostEqualTo(XYZ.BasisZ.negate())) && 
            pf.Origin.Z == plane.Origin.Z)
            cutFace = pf;
    }
    if (cutFace == null) return null;
    CurveLoop boundary = cutFace.GetEdgesAsCurveLoops()[0];
    return boundary;
}
```

Code snippet to apply the process to wall location curve extraction. Note that `WallKind` attribute is used to discriminate curtain walls, which has four enumerates: `Basic` `Curtain` `Stacked` `Unknown`

```csharp
// continue from snippet-2
List<Solid> solids = new List<Solid>() { };
List<CurveLoop> sectionBounds = new List<CurveLoop>() { };
// take Z-0 plane for example
Plane plane = Plane.CreateByNormalAndOrigin(XYZ.BasisZ, new XYZ());

foreach (geometryObject obj in ge)
{
    if (obj is Solid)
    {
        Solid solid = obj as Solid;
        if (solid != null) solids.Add(solid);
    }
    // unpack again if there is another instance
    else if (obj is GeometryInstance)
    {
        GeometryInstance _gi = obj as GeometryInstance;
        GeometryElement _ge = _gi.GetInstanceGeometry();
        foreach (GeometryObject _obj in _go)
        {
            if (_obj is Solid)
            {
                Solid solid = _obj as Solid;
                if (solid != null) solids.Add(solid);
            }
        }
    }
}

foreach (Solid solid in solids)
{
    // skip Solid that has no actual faces and edges
    if (solid.Edges.Size == 0 || solid.Faces.Size) continue;
    sectionBounds.Add(GetSolidPlaneIntersectionCurve(plane, solid));
}

// placeholder for CurveLoop-centerlines collapse
```

## Curtain Wall

The location line can be read out from `LocaitonCurve` attribute of a curtain wall, same as basic walls. However, a curtain wall component has the same problem as to isolated geometries and missing panels. There exists hierarchical encapsulated geometries and only the basic element represents the actual space boundary. From top level to the bottom: BoundingBoxXYZ[\*](https://www.revitapidocs.com/2022/3c452286-57b1-40e2-2795-c90bff1fcec2.htm) > Bounding Geometry[\*](https://www.rhino3d.com/inside/revit/beta/guides/revit-elements#instance-bounding-geometry) > isolated element part > CurtainGrid[\*](https://www.revitapidocs.com/2022/5e0d5b7c-aaa1-d299-6fb8-2faa65b1857a.htm) > Panel[\*](https://www.revitapidocs.com/2022/ad561307-a19c-9a8a-728d-5646e90b451b.htm). For example:

Rhino.Inside includes the concept **Bounding Geometry**. Its best version should be a blob enclosing the solid union of all element geometry inside the component. However, it is just an extrusion from LocationCurve. Source [code](https://github.com/mcneel/rhino.inside-revit/blob/804619c84f86bac37ca051263b35a9e59550e227/src/RhinoInside.Revit.GH/Components/Element/BoundingGeometry.cs) here for reference. Notes from the official document:
> Sometimes it is necessary to extract the Bounding Geometry of an instance. Bounding Geometry is a geometry that wraps the instance geometry as close as possible and generally follows the instance geometry topology. Currently, Bounding Geometry component only works with Walls but will be extended to work with other Revit categories in the future.

![An unusual curtain wall](/assets/curtainwall_component.png)

Some routes to get the location curve:
1. From `LocationCurve` attribute
2. Get the vertical lines from Curtain Grid, then connect all the intersection points between those lines and the floor plane. Revit does not have methods for Plane-Curve intersections but you can code it yourself, ref: [Plane and Curve intersection](https://www.parametriczoo.com/index.php/2020/03/31/plane-and-curve-intersection/). However, for horizontal plane intersection with lines, you only need to write the function of lines then put in the Z values.
3. Get all the panels of a curtain wall, then retrieve the section curve just like the basic walls.

```csharp
// get the geometry of panels of a curtain wall
// continue from snippet-1
Application app = commandData.Application.Application;

foreach (Element e in _eWalls)
{
    Wall wall = e as Wall;
    if (wall.WallType.Kind == WallKind.Curtain)
    {
        List<Solid> solids = new List<Solid>() { };
        Options ops = app.Create.NewGeometryOptions();
        ops.IncludeNonVisibleObjects = false;

        CurtainGrid grid = wall.CurtainGrid;
        foreach (ElementId id in grid.GetPanelIds())
        {
            Element _e = doc.GetElement(id);
            GeometryElement _ge = _e.get_Geometry(ops);
            foreach (GeometryObject obj in _ge)
            {
                // same as snippet-4 processing wall elements
            }
        }
    }
}

```

## Curtain System

Curtain System does not have `LocationCurve` attributes. That's the main difference. To this point, let's make some summary. Paths that lead to the location curve (on each floor) of Wall/Curtain/CurtainSystem:

1. With `LocationCurve` attribute. Wall✓ Curtain✓ CurtainSystem✗. The location curve is the attribute of the component, not the geometry elements within the component.
2. By wall surface attribute. Another way is maybe you could retrieve the exterior surface of a wall type, but it seems not effective when dealing with curtain wall type. Check this post for detailed code: [how to get the wall bottom edges on the exterior face of a wall?](https://forums.autodesk.com/t5/revit-api-forum/how-to-get-the-wall-bottom-edges-on-the-exterior-face-of-a-wall/m-p/7072799)
3. By element bounding geometry
    A practical way manipulating curtain walls. Check this post [Access to Curtain Grid Panels](https://thebuildingcoder.typepad.com/blog/2010/09/access-to-curtain-grid-panels.html)and lookup the function in BuildingCoder: CmdCurtainWallGeom.cs. 
  However, the right way to do this, is to calculate the intersected curve of the level plane and the base face of curtains. This post offers computational geometric solution from scratch, and another cunning way via RevitAPI: [Plane and Curve intersection](https://www.parametriczoo.com/index.php/2020/03/31/plane-and-curve-intersection/) [Plane and curve intersection (2)](https://www.parametriczoo.com/index.php/2020/04/07/plane-and-curve-intersection-2/). You may find assitant functions in the RevitAPI code samples, such as the point projection: [Planes, Projections and Picking Points](https://thebuildingcoder.typepad.com/blog/2014/09/planes-projections-and-picking-points.html)
4. By panel vertice at the bottom
    More information can be gained when it comes down to such a detailed level as to the curtain panel. But it is still hard to replicate the whole geometry of the curtain system/wall based soly on panels. So an accessible way to this problem is to project the adjacent vertices to the target plane then get the boundary line. 
  - Access the vertice by edges of panel geometry element. The RevitAPIDocs offer some code about this, but I did not test it through.
  - Access the curve loop through curtain cells. There seems to be an API failure in this. Sometimes the program throws exceptions when trying to access parameter of `CurtainCell.` `CurveLoops`. Even if you use Revit Lookup, it will pop up warnings as well: 'Exception has been thrown by the target of an invocation'
5. By rectified curtain grids
    Seems the only way to get the rough geometry of curtain system for that the curtain system is not a wall. It has no bounding element, no location curve, only the grids and the panels. Interesting thing is, the curtain grids exclude the boundary. All grid lines retrieved from `GetVGridLineIds` and `GetUGridLineIds` are the lattice so they must be further processed to form the entire boundary of the curtain wall. 
  After getting all the grids, it is easy to calculate the boundary on each floor by joining the intersection of grids and the level plane, forming a polyline. This process bypasses the NURBS curtain components. It is reliable because the panels are usually all planar faces, no matter what curvature the curtain has.


## Appendix