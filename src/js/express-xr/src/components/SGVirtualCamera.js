const { useUpdate, useThree, useRender } = require('react-three-fiber')
const React = require('react')
const { useEffect, useRef, useState, useMemo } = React
const { findParent } = require('../utils/xrHelperFuncs')

const SGVirtualCamera = ({ i, aspectRatio, selectedObject, hideArray, virtualCamVisible, modelData, ...props }) => {
  const [camSliderFOV, setCamSliderFOV] = useState(null)
  const [targetUpdated, setTargetUpdated] = useState(false)

  const previousTime = useRef([null])
  const isSelected = useRef(false)

  const virtualCamera = useRef(null)
  const renderTarget = useRef(null)
  const hideArrayRef = useRef([])

  const size = props.size || 1 / 3
  const padding = 0.05
  const resolution = 512

  const children = useMemo(() => {
    let children = []
    let index = 0

    if (modelData) {
      modelData.scene.traverse(child => {
        if (child instanceof THREE.Mesh) {
          children.push(<primitive key={`${props.id}-${index}`} object={child.clone()} />)
          index++
        }
      })
    }
    return children
  }, [modelData])

  const { gl, scene } = useThree()
  const selectedObj = findParent(scene.getObjectById(selectedObject))
  isSelected.current = selectedObj && selectedObj.userData.id === props.id

  const ref = useUpdate(
    self => {
      self.rotation.x = 0
      self.rotation.z = 0
      self.rotation.y = props.rotation || 0

      self.rotateX(props.tilt || 0)
      self.rotateZ(props.roll || 0)
    },
    [props.rotation, props.tilt, props.roll]
  )

  const renderCamera = () => {
    if (virtualCamera.current && renderTarget.current) {
      gl.vr.enabled = false

      for (let i = 0; i < hideArrayRef.current.length; i++) {
        hideArrayRef.current[i].visible = false
      }

      gl.setRenderTarget(renderTarget.current)
      gl.render(scene, virtualCamera.current)
      gl.setRenderTarget(null)

      for (let i = 0; i < hideArrayRef.current.length; i++) {
        hideArrayRef.current[i].visible = true
      }

      gl.vr.enabled = true
    }
  }

  useEffect(() => {
    hideArrayRef.current = hideArray
  }, [hideArray])

  useEffect(() => {
    if (!renderTarget.current) {
      renderTarget.current = new THREE.WebGLRenderTarget(resolution * aspectRatio, resolution)
      setTargetUpdated(true)
    }

    if (virtualCamera.current) {
      virtualCamera.current.addEventListener('updateFOV', e => setCamSliderFOV(e.fov))
    }
  }, [])

  useRender(() => {
    if (!previousTime.current) previousTime.current = 0

    const currentTime = Date.now()
    const delta = currentTime - previousTime.current

    if (delta > 500) {
      previousTime.current = currentTime
    } else {
      if (!props.guiCamera && !isSelected.current) return
    }

    renderCamera()
  })

  const heightShader = useMemo(() => {
    const heightShader = new THREE.MeshBasicMaterial({
      map: renderTarget.current ? renderTarget.current.texture : null,
      side: THREE.DoubleSide,
      depthTest: props.guiCamera ? false : true,
      depthWrite: props.guiCamera ? false : true,
      transparent: props.guiCamera ? true : false
    })

    return heightShader
  }, [targetUpdated])

  return (
    <group
      userData={{ id: props.id, displayName: props.displayName, type: 'virtual-camera', forPanel: { fov: props.fov } }}
      position={[props.x || 0, props.z || 0, props.y || 0]}
      ref={ref}
    >
      <group visible={virtualCamVisible || props.guiCamera === true}>
        <mesh
          userData={{ type: props.guiCamera ? 'gui' : 'view' }}
          position={[0, props.guiCamera ? 0 : 0.3, (props.guiCamera ? 0.0025 : 0.01)]}
          material={heightShader}
        >
          <planeGeometry attach="geometry" args={[size * aspectRatio, size]} />
        </mesh>
        {children}
        {!props.guiCamera && (
          <mesh
            position={[0, 0.3, -0.01]}
            rotation={[0, Math.PI, 0]}
            userData={{ type: props.guiCamera ? 'gui' : 'view' }}
            material={heightShader}
          >
            <planeGeometry attach="geometry" args={[size * aspectRatio, size]} />
          </mesh>
        )}
        <mesh position={[0, props.guiCamera ? 0 : 0.3, 0]} material={new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })}>
          <planeGeometry
            attach="geometry"
            args={[size * aspectRatio + (props.guiCamera ? 0.005 : 0.015), size + (props.guiCamera ? 0.005 : 0.015)]}
          />
        </mesh>
        <group position={props.camOffset || new THREE.Vector3()}>
          <perspectiveCamera
            name={props.guiCamera ? 'guiCam' : ''}
            ref={virtualCamera}
            aspect={aspectRatio}
            fov={camSliderFOV || props.fov}
            near={0.01}
            far={1000}
            onUpdate={self => self.updateProjectionMatrix()}
          />
          {props.children}
        </group>
      </group>
    </group>
  )
}

module.exports = SGVirtualCamera
