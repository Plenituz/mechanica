import argparse
import bpy
import bmesh
import os
import time
import threading
from bpy.app.handlers import persistent

def reset_blend():
    bpy.ops.wm.read_factory_settings()

    for scene in bpy.data.scenes:
        for obj in scene.objects:
            scene.objects.unlink(obj)

    # only worry about data in the startup scene
    for bpy_data_iter in (
            bpy.data.objects,
            bpy.data.meshes,
            bpy.data.lamps,
            bpy.data.cameras,
            ):
        for id_data in bpy_data_iter:
            bpy_data_iter.remove(id_data)
 
def get_args():
  parser = argparse.ArgumentParser()
 
  # get all script args
  _, all_arguments = parser.parse_known_args()
  double_dash_index = all_arguments.index('--')
  script_args = all_arguments[double_dash_index + 1: ]
 
  # add parser rules
  parser.add_argument('-r', '--read', help="file to convert")
  parser.add_argument('-t', '--to', help="output file")
  
  parsed_script_args, _ = parser.parse_known_args(script_args)
  return parsed_script_args
 
def import_appropriate(type):
	global args
	if(type == ".obj"):
		bpy.ops.import_scene.obj(filepath=args.read)
	if(type == ".fbx"):
		bpy.ops.import_scene.fbx(filepath=args.read)
	if(type == ".3ds"):
		bpy.ops.import_scene.autodesk_3ds(filepath=args.read)
	if(type == ".x3d" or type == ".wrl"):
		bpy.ops.import_scene.x3d(filepath=args.read)
	#import mesh
	if(type == ".ply"):
		bpy.ops.import_mesh.ply(filepath=args.read)
	if(type == ".stl"):
		bpy.ops.import_mesh.stl(filepath=args.read)
	#import wm
	if(type == ".dae"):
		bpy.ops.wm.collada_import(filepath=args.read)
	if(type == ".abc"):
		print("abddddddd")
		bpy.ops.wm.alembic_import(filepath=args.read)
		
@persistent
def call_load_handlers(dummyArg):
	#bpy.app.handlers.scene_update_post.remove(call_load_handlers)
	print("scene update post: " + str(len(bpy.data.objects)))
	#bpy.ops.export_scene.obj(filepath=args.to)
 
args = get_args()
reset_blend()

class Waiter(threading.Thread):
	def run(self):
		print("thread")
		current_milli_time = lambda: int(round(time.time() * 1000))
		startTime = current_milli_time()
		current = current_milli_time()
		while(current < startTime + 5000):
			current = current_milli_time()
			time.sleep(0.1)
		
	
count = 0
bpy.app.handlers.scene_update_post.append(call_load_handlers)
print("efkdfd")

#extract the extension
filename, fileext = os.path.splitext(args.read)
type = fileext.lower()
import_appropriate(type)
w = Waiter()
w.start()
print("salut je vais vien")
#bpy.ops.export_scene.obj(filepath=args.to)
#bpy.ops.export_scene.obj(filepath=args.to)






#TODO obj = mtl ?
#currently supported formats : .obj, .fbx, .3ds, .x3d/.wrl, .ply, .stl, .dae, .abc
#import scenes


#TODO ici on doit attendre que l'import se finisse, https://blender.stackexchange.com/questions/64960/how-to-wait-for-bpy-ops-wm-alembic-import-to-finish
#pas faire exactement comme le lien :
#surveiller la taille de la scene, tant qu'elle augmente continuer d'attendre 


"""
objs = bpy.context.scene.objects
verticesStr = ""
trianglesStr = ""


for obj in objs:
	#mesh = bmesh.from_edit_mesh(obj.data)
	#mStr += ("# of vertices=%d" % len(mesh.vertices))
	verts = [vert.co for vert in obj.data.vertices]
	for vert in verts:
	#pas sur de la syntax apres
		verticesStr += '%f,%f,%f|' % (vert.x, vert.y, vert.z)
		#mStr += ( 'v %f %f %f\n' % (vert.co.x, vert.co.y, vert.co.z) )

	#mStr += ("# of faces=%d" % len(mesh.polygons))

	for face in obj.data.polygons:
		#mStr += 'face'
		for vert in face.vertices:
			trianglesStr += str(vert)
			trianglesStr += ","


#outStr = "vertices = [\n" + verticesStr + "\n]\n"
#outStr += "triangles = [\n" + trianglesStr + "\n]\n"

outStr = trianglesStr;

mFile = open(args.to, "w")
mFile.write(outStr)
mFile.close()
"""

# export scene
#bpy.ops.export_scene.obj(filepath=args.to)

#"C:\Program Files\Blender Foundation\Blender\blender.exe" -b -P ./script.py -- --read D:\_CODING\wedev\mechanica\public\fileconvert\cube.obj --to D:\_CODING\wedev\mechanica\public\fileconvert\out.obj