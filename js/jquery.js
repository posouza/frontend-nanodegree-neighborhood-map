// $(document).ready(function() {
//   //Show/hide the search menu on button click
//     var toggle = true;
//     function show() {
//       function bigViewport() {
//         if(window.matchMedia("(min-width: 601px)").matches) {
//           $('#nav').slideDown(1000);
//           $('#search-area').slideDown(1000);
//           toggle = true;
//         }
//       }
//       function smallViewport() {
//         if(window.matchMedia("(min-width: 100px) and (max-width: 600px)").matches) {
//           $('#nav').slideDown(1000);
//           toggle = true;
//         }
//       }
//         bigViewport();
//         smallViewport();
//     }
//     function hide() {
//         $('#nav').slideUp(1000);
//         toggle = false;
//         console.log(toggle);
//         }
//
//     function toggleSideView(){
//       if(toggle === true) {
//         hide();
//       } else {
//         show();
//       }
//     }
//     $('.toggle-btn').click(toggleSideView);
// });
