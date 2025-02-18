<template>
  <div w-full h-full border rounded flex flex-col overflow-auto>
    <div shrink-0 bg-gray-1 p-1 flex justify-between items-center>
      <slot name="header"></slot>
    </div>

    <slot></slot>
  </div>
</template>
