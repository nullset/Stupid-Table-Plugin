// Copyright (c) 2012 Joseph McCullough
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy   
// of this software and associated documentation files (the "Software"), to deal   
// in the Software without restriction, including without limitation the rights   
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell   
// copies of the Software, and to permit persons to whom the Software is   
// furnished to do so, subject to the following conditions:  
// 
// The above copyright notice and this permission notice shall be included in all  
// copies or substantial portions of the Software.  
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR   
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,  
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE  
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER  
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,  
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE  
// SOFTWARE.


// Stupid jQuery table plugin.

// Call on a table 
// sortFns: Sort functions for your datatypes.
(function($){
  $.fn.stupidtable = function(sortFns){
    var table = this; sortFns = sortFns || {};
    
    var columns = table.find('.table-data-header li');
    // Add <a> to all headers to make them consistent
    columns.each(function() {
      if ($(this).find('a').length > 0) {
        $(this).find('a').attr('href', '#');
      } else {
        $(this).find('.table-cell-text').wrapInner('<a href="#" />').append('<span class="sortable"></span>');
      }
    });
    

    // ==================================================== //
    //                  Utility functions                   //
    // ==================================================== //

    // Merge sort functions with some default sort functions.
    sortFns = $.extend({}, {
      "int":function(a,b){ return parseInt(a, 10) - parseInt(b,10); },
      "float":function(a,b){ return parseFloat(a) - parseFloat(b); },
      "string":function(a,b){ if (a<b) return -1; if (a>b) return +1; return 0;}
    }, sortFns);

    // Array comparison. See http://stackoverflow.com/a/8618383
    var arrays_equal = function(a,b) { return !!a && !!b && !(a<b || b<a);}

    // Return the resulting indexes of a sort so we can apply
    // this result elsewhere. This returns an array of index numbers.
    // return[0] = x means "arr's 0th element is now at x"
    var sort_map =  function(arr, sort_function){
      var sorted = arr.slice(0).sort(sort_function); 
      var map = [];
      var index = 0;
      for(var i=0; i<arr.length; i++){
        index = $.inArray(arr[i], sorted);

        // If this index is already in the map, look for the next index.
        // This handles the case of duplicate entries.
        while($.inArray(index, map) != -1){
          index++;
        }
        map.push(index);
      }
      return map;
    }

    // Apply a sort map to the array. 
    var apply_sort_map = function(arr, map){
      var clone = arr.slice(0);
      for(var i=0; i<map.length; i++){
        newIndex = map[i];
        clone[newIndex] = arr[i];
      }
      return clone;
    }

    // Returns true if array is sorted, false otherwise.
    // Checks for both ascending and descending
    var is_sorted_array = function(arr, sort_function){
      var clone = arr.slice(0);
      var reversed = arr.slice(0).reverse();
      var sorted = arr.slice(0).sort(sort_function);
      
      // Check if the array is sorted in either direction.
      return arrays_equal(clone, sorted) || arrays_equal(reversed, sorted);
    }

    // ==================================================== //
    //                  Begin execution!                    //
    // ==================================================== //

    // Unregister click handler, in case the sort method is called twice on the same table
    table.undelegate(".table-data-header li", "click");

    // Do sorting when header LIs are clicked
    table.delegate(".table-data-header li", "click", function(){
      var trs = table.find("ul.table-data-row");
      
      // Add sort arrow
      var sortCol = $(this).find('.table-cell-text .sortable');
      columns.find('.table-cell-text .sortable').each(function() {
        if ($(this)[0] != sortCol[0]) {
          $(this).removeClass('asc').removeClass('desc');
        } else {
          if (sortCol.hasClass('asc')) {
            sortCol.removeClass('asc').addClass('desc');
          } else {
            sortCol.removeClass('desc').addClass('asc');
          }
        }
      });
      
      var i = $(this).index();
      var classes = $(this).attr("class");
      var type = null;
      if (classes){
        classes = classes.split(/\s+/);

        for(var j=0; j<classes.length; j++){
          if(classes[j].search("type-") != -1){
            type = classes[j];
            break;
          }
        }
        if(type){
          type = type.split('-')[1];
        }
      }
      if(type){
        var sortMethod = sortFns[type];

        // Gather the elements for this column
        column = [];

        // Push either the value of the 'data-order-by' attribute if specified
        // or just the text() value in this column to column[] for comparison.
        trs.each(function(index,tr){
          var e = $(tr).children().eq(i);
          var order_by = e.attr('data-order-by') || e.text().toLowerCase();
          column.push(order_by);
        });

        // If the column is already sorted, just reverse the order. The sort
        // map is just reversing the indexes.
        if(is_sorted_array(column, sortMethod)){
          column.reverse();
          var theMap = [];
          for(var i=column.length-1; i>=0; i--){
            theMap.push(i);
          }
        }
        else{
          // Get a sort map and apply to all rows
          theMap = sort_map(column, sortMethod);
        }

        var sortedTRs = $(apply_sort_map(trs, theMap));

        // Replace the content of tbody with the sortedTRs. Strangely (and
        // conveniently!) enough, .append accomplishes this for us.
        table.find(".table-scroll").append(sortedTRs);
      }
    });
  }
 })(jQuery);